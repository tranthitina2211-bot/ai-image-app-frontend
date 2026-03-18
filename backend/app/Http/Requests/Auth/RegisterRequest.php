<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your display name.',
            'email.required' => 'Please enter your email address.',
            'email.unique' => 'This email is already registered.',
            'password.required' => 'Please create a password.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
