<?php

namespace App\Services\Generation;

use App\Models\GenerationJob;
use App\Support\Generation\WorkflowTemplateBuilder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ComfyUiService
{
    public function queueJob(GenerationJob $job): array
    {
        $baseUrl = rtrim(config('services.comfyui.base_url', 'http://127.0.0.1:8188'), '/');
        $template = WorkflowTemplateBuilder::resolveTemplate($job->action, $job->mode);
        $workflowPath = storage_path('app/comfy/workflows/' . $template);

        Log::info('Preparing ComfyUI workflow', [
            'job_id' => $job->id,
            'base_url' => $baseUrl,
            'template' => $template,
            'workflow_path' => $workflowPath,
            'action' => $job->action,
            'mode' => $job->mode,
        ]);

        if (! File::exists($workflowPath)) {
            Log::error('Workflow template not found', [
                'job_id' => $job->id,
                'template' => $template,
                'workflow_path' => $workflowPath,
            ]);

            throw new RuntimeException("Workflow template not found: {$template}");
        }

        $context = [
            'job_id' => $job->id,
            'prompt' => $job->prompt,
            'negative_prompt' => $job->negative_prompt,
            'ratio' => $job->ratio,
            'resolution' => $job->resolution,
            'seed' => $job->seed,
            'input_image' => $this->resolveInputImage($job),
        ];

        Log::info('ComfyUI workflow context prepared', [
            'job_id' => $job->id,
            'context' => $context,
        ]);

        $workflow = File::get($workflowPath);
        $workflow = str_replace(
            array_keys(WorkflowTemplateBuilder::replacements($context)),
            array_values(WorkflowTemplateBuilder::replacements($context)),
            $workflow
        );

        $decoded = json_decode($workflow, true);
        if (! is_array($decoded) || ! isset($decoded['prompt'])) {
            Log::error('Workflow template is not valid API JSON', [
                'job_id' => $job->id,
                'template' => $template,
            ]);

            throw new RuntimeException('Workflow template is not valid API JSON.');
        }

        Log::info('Sending request to ComfyUI /prompt', [
            'job_id' => $job->id,
            'endpoint' => $baseUrl . '/prompt',
        ]);

        $response = Http::timeout((int) config('services.comfyui.timeout', 90))
            ->acceptJson()
            ->post($baseUrl . '/prompt', [
                'prompt' => $decoded['prompt'],
                'client_id' => $job->id,
            ]);

        Log::info('Received response from ComfyUI /prompt', [
            'job_id' => $job->id,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        if (! $response->successful()) {
            Log::error('Failed to queue ComfyUI job', [
                'job_id' => $job->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Failed to queue ComfyUI job: ' . $response->body());
        }

        return [
            'driver' => 'comfyui',
            'provider_job_id' => $response->json('prompt_id'),
            'workflow' => $template,
        ];
    }

    public function fetchHistory(string $providerJobId): array
    {
        $baseUrl = rtrim(config('services.comfyui.base_url', 'http://127.0.0.1:8188'), '/');

        Log::info('Fetching ComfyUI history', [
            'provider_job_id' => $providerJobId,
            'endpoint' => $baseUrl . '/history/' . $providerJobId,
        ]);

        $response = Http::timeout((int) config('services.comfyui.timeout', 90))
            ->acceptJson()
            ->get($baseUrl . '/history/' . $providerJobId);

        Log::info('Received ComfyUI history response', [
            'provider_job_id' => $providerJobId,
            'status' => $response->status(),
        ]);

        return $response->json() ?? [];
    }

    public function extractResultFromHistory(string $providerJobId, array $history): ?array
    {
        $nodeOutputs = data_get($history, $providerJobId . '.outputs', []);
        Log::info('Extracting result from ComfyUI history', [
            'provider_job_id' => $providerJobId,
            'has_outputs' => is_array($nodeOutputs),
        ]);

        if (! is_array($nodeOutputs)) {
            return null;
        }

        foreach ($nodeOutputs as $nodeId => $payload) {
            if (! empty($payload['images'][0])) {
                $image = $payload['images'][0];

                Log::info('Image output found in ComfyUI history', [
                    'provider_job_id' => $providerJobId,
                    'node' => $nodeId,
                    'image' => $image,
                ]);

                return [
                    'node' => $nodeId,
                    'type' => 'image',
                    'filename' => $image['filename'] ?? null,
                    'subfolder' => $image['subfolder'] ?? '',
                    'folder_type' => $image['type'] ?? 'output',
                ];
            }

            if (! empty($payload['gifs'][0])) {
                $video = $payload['gifs'][0];

                Log::info('Video output found in ComfyUI history', [
                    'provider_job_id' => $providerJobId,
                    'node' => $nodeId,
                    'video' => $video,
                ]);

                return [
                    'node' => $nodeId,
                    'type' => 'video',
                    'filename' => $video['filename'] ?? null,
                    'subfolder' => $video['subfolder'] ?? '',
                    'folder_type' => $video['type'] ?? 'output',
                ];
            }
        }

        Log::warning('No readable output found in ComfyUI history', [
            'provider_job_id' => $providerJobId,
        ]);

        return null;
    }

    public function resolveOutputAbsolutePath(array $result): string
    {
        $baseOutputDir = rtrim(config('services.comfyui.output_dir', base_path('ComfyUI/output')), DIRECTORY_SEPARATOR);
        $subfolder = trim((string) ($result['subfolder'] ?? ''), '/\\');
        $filename = basename((string) ($result['filename'] ?? ''));

        $parts = array_filter([$baseOutputDir, $subfolder, $filename]);
        $path = implode(DIRECTORY_SEPARATOR, $parts);

        Log::info('Resolved ComfyUI absolute output path', [
            'result' => $result,
            'path' => $path,
        ]);

        return $path;
    }

    private function resolveInputImage(GenerationJob $job): string
    {
        $inputDir = rtrim(config('services.comfyui.input_dir', base_path('ComfyUI/input')), DIRECTORY_SEPARATOR);
        File::ensureDirectoryExists($inputDir);

        Log::info('Resolving input image for ComfyUI', [
            'job_id' => $job->id,
        ]);

        if ($job->input_file_path && File::exists($job->input_file_path)) {
            $filename = basename($job->input_file_path);

            Log::info('Using direct input file path for ComfyUI', [
                'job_id' => $job->id,
                'input_file_path' => $job->input_file_path,
                'filename' => $filename,
            ]);

            File::copy($job->input_file_path, $inputDir . DIRECTORY_SEPARATOR . $filename);
            return $filename;
        }

        $parent = $job->parentMediaItem;
        if (! $parent?->storage_path || ! $parent->storage_disk) {
            Log::warning('No parent media item storage found for ComfyUI input', [
                'job_id' => $job->id,
            ]);
            return '';
        }

        $source = Storage::disk($parent->storage_disk)->path($parent->storage_path);
        if (! File::exists($source)) {
            Log::warning('Parent media source file not found for ComfyUI input', [
                'job_id' => $job->id,
                'source' => $source,
            ]);
            return '';
        }

        $filename = basename($source);

        Log::info('Copying parent media to ComfyUI input directory', [
            'job_id' => $job->id,
            'source' => $source,
            'filename' => $filename,
        ]);

        File::copy($source, $inputDir . DIRECTORY_SEPARATOR . $filename);
        return $filename;
    }
}