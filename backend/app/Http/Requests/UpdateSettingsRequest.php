<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'profile' => ['sometimes', 'array'],
            'profile.displayName' => ['sometimes', 'string', 'max:120'],
            'profile.gender' => ['sometimes', 'in:male,female,other,prefer_not_to_say'],
            'profile.birthYear' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'profile.phone' => ['nullable', 'string', 'max:30'],
            'profile.avatarUrl' => ['nullable', 'string', 'max:1000'],
            'theme' => ['sometimes', 'in:dark,light,system'],
            'gridSize' => ['sometimes', 'in:small,medium,large'],
            'autoplayVideoPreview' => ['sometimes', 'boolean'],
            'confirmBeforeDelete' => ['sometimes', 'boolean'],
            'defaultRatio' => ['sometimes', 'in:1:1,3:4,4:3,9:16,16:9'],
            'autoOpenResult' => ['sometimes', 'boolean'],
            'autoSavePrompt' => ['sometimes', 'boolean'],
        ];
    }
}
