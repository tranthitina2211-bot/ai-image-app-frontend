<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PresetController;
use App\Http\Controllers\Api\PromptHistoryController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StackController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/oauth/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::get('/oauth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);

    Route::get('/billing/plans', [BillingController::class, 'plans']);
    Route::get('/billing/overview', [BillingController::class, 'overview']);
    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::get('/billing/verify', [BillingController::class, 'verify']);

    Route::get('/media', [MediaController::class, 'index']);
    Route::get('/media/by-day', [MediaController::class, 'byDay']);
    Route::get('/media/{id}', [MediaController::class, 'show']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);

    Route::get('/stacks', [StackController::class, 'index']);
    Route::get('/stacks/{id}', [StackController::class, 'show']);

    Route::post('/generate', [GenerationController::class, 'generate']);
    Route::get('/generate/{jobId}', [GenerationController::class, 'status']);
    Route::post('/jobs/{jobId}/cancel', [GenerationController::class, 'cancel']);
    Route::post('/media/{mediaId}/variation', [GenerationController::class, 'variation']);
    Route::post('/media/{mediaId}/upscale', [GenerationController::class, 'upscale']);
    Route::post('/media/{mediaId}/image-to-video', [GenerationController::class, 'imageToVideo']);

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/media/{mediaId}/favorite', [FavoriteController::class, 'store']);
    Route::delete('/media/{mediaId}/favorite', [FavoriteController::class, 'destroy']);

    Route::get('/collections', [CollectionController::class, 'index']);
    Route::post('/collections', [CollectionController::class, 'store']);
    Route::get('/collections/{id}', [CollectionController::class, 'show']);
    Route::patch('/collections/{id}', [CollectionController::class, 'update']);
    Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);
    Route::post('/collections/{id}/items', [CollectionController::class, 'attachItems']);
    Route::delete('/collections/{id}/items/{mediaId}', [CollectionController::class, 'detachItem']);
    Route::post('/collections/{id}/reorder', [CollectionController::class, 'reorderItems']);

    Route::get('/presets', [PresetController::class, 'index']);
    Route::get('/presets/{id}', [PresetController::class, 'show']);

    Route::get('/prompt-history', [PromptHistoryController::class, 'index']);
    Route::post('/prompt-history', [PromptHistoryController::class, 'store']);
    Route::delete('/prompt-history/{id}', [PromptHistoryController::class, 'destroy']);
});
