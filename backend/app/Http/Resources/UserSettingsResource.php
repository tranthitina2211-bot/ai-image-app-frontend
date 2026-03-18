<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'profile' => [
                'displayName' => $this->display_name,
                'gender' => $this->gender,
                'birthYear' => $this->birth_year,
                'phone' => $this->phone,
                'avatarUrl' => $this->avatar_url,
            ],
            'theme' => $this->theme,
            'gridSize' => $this->grid_size,
            'autoplayVideoPreview' => $this->autoplay_video_preview,
            'confirmBeforeDelete' => $this->confirm_before_delete,
            'defaultRatio' => $this->default_ratio,
            'autoOpenResult' => $this->auto_open_result,
            'autoSavePrompt' => $this->auto_save_prompt,
        ];
    }
}
