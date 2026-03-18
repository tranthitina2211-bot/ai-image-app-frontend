<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PromptHistoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'source' => ['required', 'in:manual,media,preset'],
            'prompt' => ['required', 'string', 'max:5000'],
            'type' => ['nullable', 'in:image,video'],
            'ratio' => ['nullable', 'string', 'max:20'],
            'seed' => ['nullable', 'integer'],
            'mediaId' => ['nullable', 'string'],
            'presetId' => ['nullable', 'string'],
            'presetName' => ['nullable', 'string', 'max:255'],
        ];
    }
}
