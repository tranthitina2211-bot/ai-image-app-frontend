<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserSettingsResource;
use App\Models\User;
use App\Models\UserSetting;
use App\Services\Billing\BillingService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly BillingService $billingService)
    {
    }

    public function register(RegisterRequest $request)
    {
        Log::info('Auth register attempt', ['email' => $request->string('email')->toString()]);

        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
        ]);

        $settings = UserSetting::create([
            'user_id' => $user->id,
            'display_name' => $user->name,
            'gender' => 'prefer_not_to_say',
            'birth_year' => null,
            'phone' => '',
            'avatar_url' => $request->input('avatar_url', ''),
            'theme' => 'dark',
            'grid_size' => 'medium',
            'autoplay_video_preview' => true,
            'confirm_before_delete' => true,
            'default_ratio' => '1:1',
            'auto_open_result' => true,
            'auto_save_prompt' => true,
        ]);

        $token = $user->createToken($request->input('device_name', 'web-' . Str::random(8)))->plainTextToken;
        $plan = $this->billingService->getCurrentPlanName($user);

        Log::info('Auth register success', ['user_id' => $user->id]);
        return $this->success([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $plan,
            ],
            'settings' => new UserSettingsResource($settings),
        ], 'Registered', 201);
    }

    public function login(LoginRequest $request)
    {
        Log::info('Auth login attempt', ['email' => $request->string('email')->toString()]);
        $user = User::where('email', $request->string('email')->toString())->with('setting')->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            Log::warning('Auth login failed', ['email' => $request->string('email')->toString()]);
            return $this->error('Email hoặc mật khẩu không đúng.', 422, ['email' => ['Sai email hoặc mật khẩu.']]);
        }

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        Log::info('Auth login success', ['user_id' => $user->id]);
        return $this->success([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $this->billingService->getCurrentPlanName($user),
            ],
            'settings' => $user->setting ? new UserSettingsResource($user->setting) : null,
        ], 'Logged in');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('setting');

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $this->billingService->getCurrentPlanName($user),
            'settings' => $user->setting ? new UserSettingsResource($user->setting) : null,
        ]);
    }

    public function logout(Request $request)
    {
        Log::info('Auth logout', ['user_id' => $request->user()?->id]);
        $request->user()?->currentAccessToken()?->delete();

        return $this->success(null, 'Logged out');
    }

    public function redirectToProvider(Request $request, string $provider)
    {
        $config = $this->getProviderConfig($provider);
        abort_if(! $config, 404, 'Unsupported provider or OAuth config missing.');

        $frontendUrl = $request->query('frontend_url', config('app.frontend_url', 'http://localhost:4200/auth/login'));
        $state = base64_encode(json_encode(['frontend_url' => $frontendUrl]));
        $query = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect'],
            'response_type' => 'code',
            'scope' => $config['scope'],
            'state' => $state,
        ]);

        Log::info('OAuth redirect', ['provider' => $provider, 'frontend_url' => $frontendUrl]);
        return redirect()->away($config['authorize_url'] . '?' . $query);
    }

    public function handleProviderCallback(Request $request, string $provider)
    {
        $config = $this->getProviderConfig($provider);
        abort_if(! $config, 404, 'Unsupported provider or OAuth config missing.');

        $state = json_decode(base64_decode((string) $request->query('state')), true) ?: [];
        $frontendUrl = $state['frontend_url'] ?? config('app.frontend_url', 'http://localhost:4200/auth/login');

        if ($request->filled('error')) {
            Log::warning('OAuth callback error', ['provider' => $provider, 'error' => $request->query('error')]);
            return redirect()->away($frontendUrl . '?social_error=' . urlencode((string) $request->query('error_description', 'Social login failed.')));
        }

        try {
            $tokenResponse = Http::asForm()->post($config['token_url'], [
                'client_id' => $config['client_id'],
                'client_secret' => $config['client_secret'],
                'code' => $request->query('code'),
                'redirect_uri' => $config['redirect'],
                'grant_type' => 'authorization_code',
            ])->throw()->json();

            $accessToken = $tokenResponse['access_token'] ?? null;
            abort_unless($accessToken, 422, 'Unable to retrieve access token.');

            $profile = $this->fetchOAuthProfile($provider, $accessToken, $config);
            $email = $profile['email'] ?? null;
            if (! $email) {
                $email = sprintf('%s_%s@oauth.local', $provider, $profile['id'] ?? Str::uuid());
            }

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $profile['name'] ?? ucfirst($provider) . ' User',
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            UserSetting::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'display_name' => $user->name,
                    'gender' => 'prefer_not_to_say',
                    'birth_year' => null,
                    'phone' => '',
                    'avatar_url' => $profile['avatar'] ?? '',
                    'theme' => 'dark',
                    'grid_size' => 'medium',
                    'autoplay_video_preview' => true,
                    'confirm_before_delete' => true,
                    'default_ratio' => '1:1',
                    'auto_open_result' => true,
                    'auto_save_prompt' => true,
                ]
            );

            $token = $user->createToken('oauth-' . $provider)->plainTextToken;
            $plan = $this->billingService->getCurrentPlanName($user);

            Log::info('OAuth login success', ['provider' => $provider, 'user_id' => $user->id]);
            return redirect()->away($frontendUrl . '?' . http_build_query([
                'token' => $token,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $plan,
            ]));
        } catch (\Throwable $e) {
            Log::error('OAuth callback failed', ['provider' => $provider, 'message' => $e->getMessage()]);
            return redirect()->away($frontendUrl . '?social_error=' . urlencode('Đăng nhập mạng xã hội thất bại. Vui lòng kiểm tra cấu hình OAuth.'));
        }
    }

    private function getProviderConfig(string $provider): ?array
    {
        $providers = [
            'google' => [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect' => config('services.google.redirect'),
                'authorize_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url' => 'https://oauth2.googleapis.com/token',
                'user_url' => 'https://www.googleapis.com/oauth2/v2/userinfo',
                'scope' => 'openid email profile',
            ],
            'github' => [
                'client_id' => config('services.github.client_id'),
                'client_secret' => config('services.github.client_secret'),
                'redirect' => config('services.github.redirect'),
                'authorize_url' => 'https://github.com/login/oauth/authorize',
                'token_url' => 'https://github.com/login/oauth/access_token',
                'user_url' => 'https://api.github.com/user',
                'emails_url' => 'https://api.github.com/user/emails',
                'scope' => 'read:user user:email',
            ],
            'facebook' => [
                'client_id' => config('services.facebook.client_id'),
                'client_secret' => config('services.facebook.client_secret'),
                'redirect' => config('services.facebook.redirect'),
                'authorize_url' => 'https://www.facebook.com/v19.0/dialog/oauth',
                'token_url' => 'https://graph.facebook.com/v19.0/oauth/access_token',
                'user_url' => 'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
                'scope' => 'email public_profile',
            ],
        ];

        $config = $providers[$provider] ?? null;
        if (! $config || empty($config['client_id']) || empty($config['client_secret']) || empty($config['redirect'])) {
            return null;
        }

        return $config;
    }

    private function fetchOAuthProfile(string $provider, string $accessToken, array $config): array
    {
        if ($provider === 'github') {
            $profile = Http::withToken($accessToken)
                ->withHeaders(['Accept' => 'application/json', 'User-Agent' => 'PaintingAI'])
                ->get($config['user_url'])
                ->throw()
                ->json();

            $emails = Http::withToken($accessToken)
                ->withHeaders(['Accept' => 'application/json', 'User-Agent' => 'PaintingAI'])
                ->get($config['emails_url'])
                ->throw()
                ->json();

            $primary = collect($emails)->firstWhere('primary', true);

            return [
                'id' => $profile['id'] ?? null,
                'name' => $profile['name'] ?? $profile['login'] ?? 'GitHub User',
                'email' => $primary['email'] ?? null,
                'avatar' => $profile['avatar_url'] ?? null,
            ];
        }

        if ($provider === 'facebook') {
            $profile = Http::get($config['user_url'], ['access_token' => $accessToken])->throw()->json();
            return [
                'id' => $profile['id'] ?? null,
                'name' => $profile['name'] ?? 'Facebook User',
                'email' => $profile['email'] ?? null,
                'avatar' => data_get($profile, 'picture.data.url'),
            ];
        }

        $profile = Http::withToken($accessToken)->get($config['user_url'])->throw()->json();
        return [
            'id' => $profile['id'] ?? null,
            'name' => $profile['name'] ?? 'Google User',
            'email' => $profile['email'] ?? null,
            'avatar' => $profile['picture'] ?? null,
        ];
    }
}
