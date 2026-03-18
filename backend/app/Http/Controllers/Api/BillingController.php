<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    public function __construct(private readonly BillingService $billingService)
    {
    }

    public function plans()
    {
        return response()->json([
            'plans' => $this->billingService->plans(),
        ]);
    }

    public function overview(Request $request)
    {
        $user = $request->user();
        Log::info('Billing overview', ['user_id' => $user->id]);
        return response()->json($this->billingService->overview($user));
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'plan' => ['required', 'string'],
            'frontend_return_url' => ['nullable', 'url'],
        ]);

        $user = $request->user();
        Log::info('Billing checkout request', ['user_id' => $user->id, 'plan' => $data['plan']]);
        return response()->json($this->billingService->createCheckout($user, $data['plan'], $data['frontend_return_url'] ?? null));
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'session_id' => ['required', 'string'],
        ]);

        $user = $request->user();
        Log::info('Billing verify request', ['user_id' => $user->id, 'session_id' => $data['session_id']]);
        return response()->json($this->billingService->verifyCheckout($user, $data['session_id']));
    }
}
