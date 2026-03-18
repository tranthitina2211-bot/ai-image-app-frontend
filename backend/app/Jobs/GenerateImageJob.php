<?php

namespace App\Jobs;

use App\Events\JobProgressUpdated;
use App\Models\GenerationJob;
use App\Services\Generation\ComfyUiService;
use App\Services\Generation\GenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GenerateImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $jobId)
    {
    }

    public function handle(ComfyUiService $comfyUiService, GenerationService $generationService): void
    {
        $job = GenerationJob::query()->with(['mediaItems', 'stack', 'parentMediaItem'])->findOrFail($this->jobId);

        Log::info('GenerateImageJob started', [
            'job_id' => $this->jobId,
        ]);

        if ($job->status === 'cancelled') {
            Log::info('GenerateImageJob skipped because job was cancelled', [
                'job_id' => $this->jobId,
            ]);
            return;
        }

        $job->update([
            'status' => 'generating',
            'progress' => 5,
            'started_at' => now(),
        ]);

        $job->mediaItems()->update(['status' => 'processing', 'progress' => 5]);
        $generationService->logEvent($job, 'started', 'Worker started processing');
        broadcast(new JobProgressUpdated($job->id, ['status' => 'generating', 'progress' => 5]));

        Log::info('Sending workflow to ComfyUI', [
            'job_id' => $job->id,
        ]);

        $provider = $comfyUiService->queueJob($job);
        $providerJobId = $provider['provider_job_id'] ?? null;

        Log::info('ComfyUI queue response received', [
            'job_id' => $job->id,
            'provider_job_id' => $providerJobId,
            'provider_response' => $provider,
        ]);

        if (! $providerJobId) {
            throw new RuntimeException('ComfyUI did not return a prompt_id.');
        }

        $job->update([
            'provider_job_id' => $providerJobId,
            'progress' => 10,
        ]);

        $job->mediaItems()->update([
            'progress' => 10,
        ]);
        $history = [];
        $result = null;
        $lastProgress = 10;

        for ($attempt = 1; $attempt <= 180; $attempt++) {
            sleep(2);
            $job->refresh();

            if ($job->status === 'cancelled') {
                Log::info('GenerateImageJob stopped during polling because job was cancelled', [
                    'job_id' => $job->id,
                    'provider_job_id' => $providerJobId,
                    'attempt' => $attempt,
                ]);
                return;
            }

            $history = $comfyUiService->fetchHistory($providerJobId);

            Log::info('Polling ComfyUI history', [
                'job_id' => $job->id,
                'provider_job_id' => $providerJobId,
                'attempt' => $attempt,
            ]);

            $status = data_get($history, $providerJobId . '.status', []);
            $completed = (bool) data_get($status, 'completed', false);

            $messages = data_get($status, 'messages', []);
            $messageProgress = null;

            foreach ($messages as $message) {
                if (($message[0] ?? null) === 'progress') {
                    $value = data_get($message, '1.value');
                    $max = data_get($message, '1.max');

                    if (is_numeric($value) && is_numeric($max) && (float) $max > 0) {
                        $messageProgress = (int) floor(((float) $value / (float) $max) * 85) + 10;
                    }
                }
            }

            $progress = min(95, max($lastProgress, $messageProgress ?? ($lastProgress + 1)));
            if ($completed) {
                $progress = 98;
            }

            if ($progress !== $lastProgress) {
                $lastProgress = $progress;
                $job->update(['progress' => $progress]);
                $job->mediaItems()->update(['progress' => $progress]);
                $generationService->logEvent($job, 'progress', 'Progress updated', ['progress' => $progress]);
                broadcast(new JobProgressUpdated($job->id, ['status' => 'generating', 'progress' => $progress]));
            }

            if ($completed) {
                Log::info('ComfyUI reported completed', [
                    'job_id' => $job->id,
                    'provider_job_id' => $providerJobId,
                ]);

                $result = $comfyUiService->extractResultFromHistory($providerJobId, $history);

                Log::info('ComfyUI result extracted', [
                    'job_id' => $job->id,
                    'result' => $result,
                ]);

                break;
            }
        }

        if (! $result || empty($result['filename'])) {
            throw new RuntimeException('ComfyUI finished without a readable output file.');
        }

        $media = $job->mediaItems()->firstOrFail();

        Log::info('Resolving ComfyUI output path', [
            'job_id' => $job->id,
            'result' => $result,
        ]);

        $sourcePath = $comfyUiService->resolveOutputAbsolutePath($result);

        Log::info('Resolved output path', [
            'job_id' => $job->id,
            'source_path' => $sourcePath,
        ]);

        if (! File::exists($sourcePath)) {
            throw new RuntimeException('ComfyUI output file not found: ' . $sourcePath);
        }

        $disk = 'public';
        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
        $relativePath = 'generated/' . $media->id . '.' . $extension;

        Storage::disk($disk)->put($relativePath, File::get($sourcePath));
        $url = Storage::disk($disk)->url($relativePath);

        Log::info('Generated file saved to storage', [
            'job_id' => $job->id,
            'media_id' => $media->id,
            'disk' => $disk,
            'relative_path' => $relativePath,
            'url' => $url,
        ]);

        $mime = str_starts_with($extension, 'mp') || $extension === 'webm'
            ? ('video/' . ($extension === 'mp4' ? 'mp4' : $extension))
            : ('image/' . ($extension === 'jpg' ? 'jpeg' : $extension));

        $media->update([
            'url' => $url,
            'storage_disk' => $disk,
            'storage_path' => $relativePath,
            'mime_type' => $mime,
            'status' => 'success',
            'progress' => 100,
            'type' => str_starts_with($mime, 'video/') ? 'video' : 'image',
            'generated_at' => now(),
            'metadata' => [
                'provider_job_id' => $providerJobId,
                'comfy_output' => $result,
            ],
        ]);

        $job->update([
            'status' => 'done',
            'progress' => 100,
            'finished_at' => now(),
        ]);

        $job->stack?->update([
            'cover_media_item_id' => $media->id,
            'item_count' => $job->stack->items()->count(),
            'last_generated_at' => now(),
        ]);

        $generationService->logEvent($job, 'completed', 'Generation completed', [
            'media_item_id' => $media->id,
            'url' => $url,
        ]);

        Log::info('GenerateImageJob completed successfully', [
            'job_id' => $job->id,
            'media_id' => $media->id,
            'url' => $url,
        ]);

        broadcast(new JobProgressUpdated($job->id, [
            'status' => 'done',
            'progress' => 100,
            'image_url' => $url,
            'mediaItemId' => $media->id,
        ]));
    }

    public function failed(\Throwable $e): void
    {
        Log::error('GenerateImageJob failed', [
            'job_id' => $this->jobId,
            'error' => $e->getMessage(),
        ]);

        $job = GenerationJob::query()->with('mediaItems')->find($this->jobId);
        if (! $job) {
            return;
        }

        $job->update([
            'status' => 'failed',
            'progress' => (int) ($job->progress ?? 0),
            'error_message' => $e->getMessage(),
            'finished_at' => now(),
        ]);

        $job->mediaItems()->update([
            'status' => 'error',
            'progress' => $job->progress,
            'metadata' => ['error' => $e->getMessage()],
        ]);
    }
}