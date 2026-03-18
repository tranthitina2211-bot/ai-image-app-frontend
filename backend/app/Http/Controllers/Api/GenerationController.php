<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateStoreRequest;
use App\Models\GenerationJob;
use App\Models\MediaItem;
use App\Services\Generation\GenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GenerationController extends Controller
{
    public function __construct(private readonly GenerationService $generationService)
    {
    }

    public function generate(GenerateStoreRequest $request)
    {
        $user = $request->user();
        Log::info('Generate create request', [
            'user_id' => $user->id,
            'payload' => $request->validated()
        ]);

        $job = $this->generationService->createGenerateJob($user, $request->validated());
        $job->load('mediaItems');

        return response()->json([
            'jobId' => $job->id,
            'status' => $job->status,
            'progress' => (int) ($job->progress ?? 0),
            'mediaItemId' => $job->mediaItems->first()?->id,
        ], 201);
    }

    public function variation(Request $request, string $mediaId)
    {
        $user = $request->user();
        $media = MediaItem::query()->where('user_id', $user->id)->findOrFail($mediaId);

        Log::info('Variation x4 request', [
            'user_id' => $user->id,
            'media_id' => $mediaId,
        ]);

        $jobs = $this->generationService->createVariationJobs($user, $media, 4);

        return response()->json([
            'jobs' => $jobs->map(fn ($job) => [
                'jobId' => $job->id,
                'status' => $job->status,
                'progress' => (int) ($job->progress ?? 0),
                'mediaItemId' => $job->mediaItems->first()?->id,
            ])->values(),
        ], 201);
    }

    public function upscale(Request $request, string $mediaId)
    {
        $user = $request->user();
        $media = MediaItem::query()->where('user_id', $user->id)->findOrFail($mediaId);

        Log::info('Upscale request', [
            'user_id' => $user->id,
            'media_id' => $mediaId
        ]);

        $job = $this->generationService->createDerivedJob($user, $media, 'upscale', $media->type);
        $job->load('mediaItems');

        return response()->json([
            'jobId' => $job->id,
            'status' => $job->status,
            'progress' => (int) ($job->progress ?? 0),
            'mediaItemId' => $job->mediaItems->first()?->id,
        ], 201);
    }

    public function imageToVideo(Request $request, string $mediaId)
    {
        $user = $request->user();
        $media = MediaItem::query()->where('user_id', $user->id)->findOrFail($mediaId);

        Log::info('Image to video request', [
            'user_id' => $user->id,
            'media_id' => $mediaId
        ]);

        $job = $this->generationService->createDerivedJob($user, $media, 'image_to_video', 'video');
        $job->load('mediaItems');

        return response()->json([
            'jobId' => $job->id,
            'status' => $job->status,
            'progress' => (int) ($job->progress ?? 0),
            'mediaItemId' => $job->mediaItems->first()?->id,
        ], 201);
    }

    public function status(Request $request, string $jobId)
    {
        $user = $request->user();

        $job = GenerationJob::query()
            ->where('user_id', $user->id)
            ->with('mediaItems')
            ->findOrFail($jobId);

        $media = $job->mediaItems->first();

        return response()->json([
            'jobId' => $job->id,
            'status' => $job->status,
            'progress' => (int) ($job->progress ?? 0),
            'error' => $job->error_message,
            'providerJobId' => $job->provider_job_id,
            'startedAt' => optional($job->started_at)?->toISOString(),
            'finishedAt' => optional($job->finished_at)?->toISOString(),
            'cancelledAt' => optional($job->cancelled_at)?->toISOString(),

            'mediaItemId' => $media?->id,
            'resultUrl' => $media?->url,
            'mediaStatus' => $media?->status,
            'mediaType' => $media?->type,
        ]);
    }

    public function cancel(Request $request, string $jobId)
    {
        $user = $request->user();
        $job = GenerationJob::query()->where('user_id', $user->id)->findOrFail($jobId);

        Log::info('Cancel request', [
            'user_id' => $user->id,
            'job_id' => $jobId
        ]);

        $job = $this->generationService->cancelJob($job)->load('mediaItems');
        $media = $job->mediaItems->first();

        return response()->json([
            'jobId' => $job->id,
            'status' => $job->status,
            'progress' => (int) ($job->progress ?? 0),
            'error' => $job->error_message,
            'mediaItemId' => $media?->id,
            'resultUrl' => $media?->url,
        ]);
    }
}