<?php

namespace App\Services\Billing;

use App\Models\PaymentTransaction;
use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BillingService
{
    public function plans(): array
    {
        return [
            [
                'code' => 'starter',
                'name' => 'Starter',
                'price' => '$12',
                'amount' => 1200,
                'currency' => 'usd',
                'desc' => 'Great for testing ideas and light daily usage.',
                'features' => ['200 image credits', 'Standard queue', '1 workspace'],
                'highlight' => false,
            ],
            [
                'code' => 'pro',
                'name' => 'Pro',
                'price' => '$29',
                'amount' => 2900,
                'currency' => 'usd',
                'desc' => 'Best for creators shipping content every week.',
                'features' => ['1200 image credits', 'Fast queue', 'Unlimited collections'],
                'highlight' => true,
            ],
            [
                'code' => 'studio',
                'name' => 'Studio',
                'price' => '$79',
                'amount' => 7900,
                'currency' => 'usd',
                'desc' => 'For teams managing heavy generate and video workflows.',
                'features' => ['5000 credits', 'Priority video render', 'Shared seats'],
                'highlight' => false,
            ],
        ];
    }

    public function getPlan(string $planCode): ?array
    {
        return collect($this->plans())->firstWhere('code', $planCode);
    }

    public function getCurrentPlanName(User $user): string
    {
        $subscription = $user->activeSubscription()->first();
        return $subscription?->plan_name ?? 'Free';
    }

    public function overview(User $user): array
    {
        $subscription = $user->activeSubscription()->first();
        $transactions = $user->paymentTransactions()->latest()->limit(5)->get();

        return [
            'currentPlan' => $subscription?->plan_name ?? 'Free',
            'renewsOn' => $subscription?->renews_at?->format('M d, Y'),
            'paymentProvider' => 'Stripe',
            'paymentMethodLabel' => $subscription ? 'Hosted checkout' : 'No payment method saved yet',
            'invoices' => $transactions->map(fn (PaymentTransaction $transaction) => [
                'id' => (string) $transaction->id,
                'label' => optional($transaction->created_at)->format('M Y') ?: 'Pending',
                'amount' => '$' . number_format($transaction->amount / 100, 2),
                'status' => ucfirst($transaction->status),
            ])->values()->all(),
        ];
    }

    public function createCheckout(User $user, string $planCode, ?string $frontendReturnUrl = null): array
    {
        $plan = $this->getPlan($planCode);
        abort_if(! $plan, 422, 'Selected plan does not exist.');

        $secretKey = config('services.stripe.secret_key');
        abort_if(! $secretKey, 500, 'Stripe is not configured yet.');

        $successBase = $frontendReturnUrl ?: config('services.stripe.success_url') ?: config('app.frontend_url', 'http://localhost:4200/app/billing');
        $cancelBase = config('services.stripe.cancel_url') ?: $successBase;

        $successUrl = str_contains($successBase, '?')
            ? $successBase . '&checkout_session_id={CHECKOUT_SESSION_ID}'
            : $successBase . '?checkout_session_id={CHECKOUT_SESSION_ID}';

        $response = Http::withToken($secretKey)
            ->asForm()
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelBase,
                'line_items[0][price_data][currency]' => $plan['currency'],
                'line_items[0][price_data][product_data][name]' => 'Painting AI ' . $plan['name'],
                'line_items[0][price_data][unit_amount]' => $plan['amount'],
                'line_items[0][quantity]' => 1,
                'metadata[user_id]' => $user->id,
                'metadata[plan_code]' => $plan['code'],
            ])
            ->throw()
            ->json();

        PaymentTransaction::updateOrCreate(
            ['provider_session_id' => $response['id']],
            [
                'user_id' => $user->id,
                'plan_code' => $plan['code'],
                'provider' => 'stripe',
                'amount' => $plan['amount'],
                'currency' => $plan['currency'],
                'status' => 'pending',
                'meta' => [
                    'checkout_url' => $response['url'] ?? null,
                    'plan_name' => $plan['name'],
                ],
            ]
        );

        Log::info('Billing checkout created', ['user_id' => $user->id, 'plan' => $plan['code'], 'session_id' => $response['id']]);

        return [
            'checkoutUrl' => $response['url'] ?? null,
            'sessionId' => $response['id'],
        ];
    }

    public function verifyCheckout(User $user, string $sessionId): array
    {
        $secretKey = config('services.stripe.secret_key');
        abort_if(! $secretKey, 500, 'Stripe is not configured yet.');

        $session = Http::withToken($secretKey)
            ->get('https://api.stripe.com/v1/checkout/sessions/' . $sessionId)
            ->throw()
            ->json();

        abort_if((int) Arr::get($session, 'metadata.user_id') !== (int) $user->id, 403, 'This checkout session does not belong to the current user.');
        abort_if(Arr::get($session, 'payment_status') !== 'paid', 422, 'Payment is not completed yet.');

        $planCode = Arr::get($session, 'metadata.plan_code', 'pro');
        $plan = $this->getPlan($planCode);
        abort_if(! $plan, 422, 'Unable to resolve purchased plan.');

        DB::transaction(function () use ($user, $session, $plan) {
            $user->subscriptions()->where('status', 'active')->update([
                'status' => 'expired',
                'ends_at' => now(),
            ]);

            UserSubscription::create([
                'user_id' => $user->id,
                'plan_code' => $plan['code'],
                'plan_name' => $plan['name'],
                'status' => 'active',
                'provider' => 'stripe',
                'provider_subscription_id' => $session['id'],
                'starts_at' => now(),
                'renews_at' => Carbon::now()->addMonth(),
            ]);

            PaymentTransaction::updateOrCreate(
                ['provider_session_id' => $session['id']],
                [
                    'user_id' => $user->id,
                    'plan_code' => $plan['code'],
                    'provider' => 'stripe',
                    'provider_payment_intent_id' => $session['payment_intent'] ?? null,
                    'amount' => (int) ($session['amount_total'] ?? $plan['amount']),
                    'currency' => strtolower((string) ($session['currency'] ?? $plan['currency'])),
                    'status' => 'paid',
                    'meta' => $session,
                ]
            );
        });

        Log::info('Billing checkout verified', ['user_id' => $user->id, 'session_id' => $sessionId, 'plan' => $planCode]);
        return $this->overview($user->fresh());
    }
}
