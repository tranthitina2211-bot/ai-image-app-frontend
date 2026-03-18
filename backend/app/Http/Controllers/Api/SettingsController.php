<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Resources\UserSettingsResource;
use App\Models\UserSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    public function show(Request $request): UserSettingsResource
    {
        $user = $request->user();
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->name,
                'gender' => 'prefer_not_to_say',
                'birth_year' => null,
                'phone' => '',
                'avatar_url' => '',
                'theme' => 'dark',
                'grid_size' => 'medium',
                'autoplay_video_preview' => true,
                'confirm_before_delete' => true,
                'default_ratio' => '1:1',
                'auto_open_result' => true,
                'auto_save_prompt' => true,
            ]
        );

        Log::info('Settings shown', ['user_id' => $user->id]);
        return new UserSettingsResource($settings);
    }

    public function update(UpdateSettingsRequest $request): UserSettingsResource
    {
        $user = $request->user();
        $settings = UserSetting::firstOrCreate(['user_id' => $user->id]);
        $data = $request->validated();

        $settings->fill([
            'display_name' => data_get($data, 'profile.displayName', $settings->display_name ?: $user->name),
            'gender' => data_get($data, 'profile.gender', $settings->gender ?: 'prefer_not_to_say'),
            'birth_year' => data_get($data, 'profile.birthYear', $settings->birth_year),
            'phone' => data_get($data, 'profile.phone', $settings->phone),
            'avatar_url' => data_get($data, 'profile.avatarUrl', $settings->avatar_url),
            'theme' => $data['theme'] ?? $settings->theme ?? 'dark',
            'grid_size' => $data['gridSize'] ?? $settings->grid_size ?? 'medium',
            'autoplay_video_preview' => $data['autoplayVideoPreview'] ?? $settings->autoplay_video_preview ?? true,
            'confirm_before_delete' => $data['confirmBeforeDelete'] ?? $settings->confirm_before_delete ?? true,
            'default_ratio' => $data['defaultRatio'] ?? $settings->default_ratio ?? '1:1',
            'auto_open_result' => $data['autoOpenResult'] ?? $settings->auto_open_result ?? true,
            'auto_save_prompt' => $data['autoSavePrompt'] ?? $settings->auto_save_prompt ?? true,
        ]);
        $settings->save();

        if ($settings->display_name && $user->name !== $settings->display_name) {
            $user->forceFill(['name' => $settings->display_name])->save();
        }

        Log::info('Settings updated', ['user_id' => $user->id, 'payload' => $data]);
        return new UserSettingsResource($settings->fresh());
    }
}
