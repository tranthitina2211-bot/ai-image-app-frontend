<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:5000'],
            'ratio' => ['required', 'string', 'max:20'],
            'mode' => ['required', 'in:image,video'],
            'resolution' => ['nullable', 'string', 'max:50'],
            'seed' => ['nullable', 'integer'],
            'fileAttach' => ['nullable', 'file', 'max:10240'],
        ];
    }
}
