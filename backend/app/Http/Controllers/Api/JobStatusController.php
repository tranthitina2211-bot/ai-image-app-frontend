<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class JobStatusController
{
    public function status(string $jobId)
    {
        $job = cache()->get("job:$jobId");

        if (!$job) {
            return response()->json(['status' => 'not_found']);
        }

        $promptId = $job['prompt_id'];

        $history = Http::get(
            "http://127.0.0.1:8188/history/{$promptId}"
        )->json();

        $status = $history[$promptId]['status'] ?? null;

        if (!$status) {
            return response()->json(['status' => 'pending']);
        }

        if ($status['completed'] === true) {
            return response()->json([
                'status' => 'done',
                'progress' => 100
            ]);
        }

        foreach ($status['messages'] ?? [] as $msg) {
            if ($msg[0] === 'progress') {
                return response()->json([
                    'status' => 'running',
                    'progress' => round($msg[1]['value'] * 100)
                ]);
            }
        }

        return response()->json([
            'status' => 'running',
            'progress' => 60
        ]);
    }
}




