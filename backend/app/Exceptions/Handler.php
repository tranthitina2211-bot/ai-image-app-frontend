<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->renderable(function (ValidationException $e, $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'meta' => (object) [],
            ], $e->status);
        });

        $this->renderable(function (AuthenticationException $e, $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
                'errors' => (object) [],
                'meta' => (object) [],
            ], 401);
        });

        $this->renderable(function (Throwable $e, $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            return response()->json([
                'success' => false,
                'message' => app()->hasDebugModeEnabled() ? $e->getMessage() : 'Unexpected server error.',
                'errors' => (object) [],
                'meta' => (object) [],
            ], $status);
        });
    }
}
