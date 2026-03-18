<?php

namespace App\Services\Generation;

use App\Events\JobProgressUpdated;
use App\Jobs\GenerateImageJob;
use App\Models\GenerationJob;
use App\Models\GenerationJobEvent;
use App\Models\MediaItem;
use App\Models\MediaStack;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GenerationService
{
    public function createGenerateJob(User $user, array $payload): GenerationJob
    {
        $inputFilePath = null;
        if (($payload['fileAttach'] ?? null) instanceof \Illuminate\Http\UploadedFile) {
            $inputFilePath = $payload['fileAttach']->store('inputs', 'local');
            $inputFilePath = Storage::disk('local')->path($inputFilePath);
        }

        return DB::transaction(function () use ($user, $payload, $inputFilePath) {
            $stack = MediaStack::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'source_type' => 'generate',
                'order_in_board' => now()->valueOf(),
                'item_count' => 1,
                'last_generated_at' => now(),
            ]);

            $job = GenerationJob::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'media_stack_id' => $stack->id,
                'action' => 'generate',
                'mode' => $payload['mode'],
                'provider' => config('services.comfyui.driver', 'comfyui'),
                'status' => 'queued',
                'progress' => 0,
                'prompt' => $payload['prompt'],
                'ratio' => $payload['ratio'],
                'resolution' => $payload['resolution'] ?? null,
                'seed' => $payload['seed'] ?? null,
                'queued_at' => now(),
                'input_file_path' => $inputFilePath,
                'payload' => collect($payload)->except('fileAttach')->all(),
            ]);

            $media = MediaItem::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'media_stack_id' => $stack->id,
                'source_job_id' => $job->id,
                'kind' => 'media',
                'type' => $payload['mode'],
                'prompt' => $payload['prompt'],
                'ratio' => $payload['ratio'],
                'resolution' => $payload['resolution'] ?? null,
                'seed' => $payload['seed'] ?? null,
                'status' => 'processing',
                'progress' => 7,
                'order_in_stack' => 1,
                'order_in_board' => now()->valueOf(),
                'generated_at' => now(),
            ]);

            $stack->update([
                'root_media_item_id' => $media->id,
                'cover_media_item_id' => $media->id,
            ]);

            $this->logEvent($job, 'queued', 'Generation job created', ['media_item_id' => $media->id]);
            Log::info('Generation job created', ['job_id' => $job->id, 'user_id' => $user->id]);

            GenerateImageJob::dispatch($job->id);

            broadcast(new JobProgressUpdated($job->id, [
                'status' => 'queued',
                'progress' => 7,
                'mediaItemId' => $media->id,
            ]));

            return $job->fresh(['mediaItems']);
        });
    }

    public function createDerivedJob(User $user, MediaItem $parent, string $action, string $mode = null): GenerationJob
    {
        $mode ??= $action === 'image_to_video' ? 'video' : 'image';

        return DB::transaction(function () use ($user, $parent, $action, $mode) {
            $stack = $parent->stack;
            $nextOrder = (int) $stack->items()->whereNull('ghost_of_media_item_id')->max('order_in_stack') + 1;

            $job = GenerationJob::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'media_stack_id' => $stack->id,
                'parent_media_item_id' => $parent->id,
                'action' => $action,
                'mode' => $mode,
                'provider' => config('services.comfyui.driver', 'comfyui'),
                'status' => 'queued',
                'progress' => 0,
                'prompt' => $parent->prompt,
                'ratio' => $parent->ratio,
                'resolution' => $parent->resolution,
                'seed' => $parent->seed,
                'queued_at' => now(),
                'payload' => [
                    'parentId' => $parent->id,
                    'stackId' => $stack->id,
                    'action' => $action,
                ],
            ]);

            $media = MediaItem::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'media_stack_id' => $stack->id,
                'source_job_id' => $job->id,
                'parent_media_item_id' => $parent->id,
                'kind' => 'media',
                'type' => $mode,
                'prompt' => $parent->prompt,
                'ratio' => $parent->ratio,
                'resolution' => $parent->resolution,
                'seed' => $parent->seed,
                'status' => 'processing',
                'progress' => 7,
                'order_in_stack' => $nextOrder,
                'order_in_board' => $stack->order_in_board,
                'generated_at' => now(),
            ]);

            $stack->update([
                'item_count' => $stack->items()->count(),
                'last_generated_at' => now(),
            ]);

            $this->logEvent($job, 'queued', 'Derived job created', ['media_item_id' => $media->id]);
            Log::info('Derived generation job created', ['job_id' => $job->id, 'action' => $action, 'user_id' => $user->id]);
            GenerateImageJob::dispatch($job->id);
            broadcast(new JobProgressUpdated($job->id, [
                'status' => 'queued',
                'progress' => 7,
                'mediaItemId' => $media->id,
            ]));

            return $job->fresh(['mediaItems']);
        });
    }

    public function createVariationJobs(User $user, MediaItem $parent, int $count = 4): Collection
    {
        return collect(range(1, max(1, $count)))
            ->map(fn () => $this->createDerivedJob($user, $parent, 'variation', 'image')->load('mediaItems'));
    }

    public function cancelJob(GenerationJob $job): GenerationJob
    {
        $job->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'progress' => $job->progress,
        ]);

        $job->mediaItems()->get()->each(function (MediaItem $media) use ($job) {
            $media->update([
                'status' => 'error',
                'progress' => $job->progress,
            ]);
            $media->delete();
        });

        $this->logEvent($job, 'cancelled', 'Job cancelled by user');
        Log::info('Generation job cancelled', ['job_id' => $job->id]);

        broadcast(new JobProgressUpdated($job->id, [
            'status' => 'cancelled',
            'progress' => $job->progress,
        ]));

        return $job->fresh(['mediaItems']);
    }

    public function logEvent(GenerationJob $job, string $eventType, string $message, array $payload = []): void
    {
        GenerationJobEvent::create([
            'generation_job_id' => $job->id,
            'event_type' => $eventType,
            'message' => $message,
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }
}
