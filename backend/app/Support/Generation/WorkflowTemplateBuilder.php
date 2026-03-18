<?php

namespace App\Support\Generation;

class WorkflowTemplateBuilder
{
    public static function resolveTemplate(string $action, string $mode): string
    {
        return match ($action) {
            'generate' => $mode === 'video' ? 'txt2vid_basic.json' : 'txt2img_cpu_test.json',
            'variation' => 'img2img_variation.json',
            'upscale' => 'img_upscale.json',
            'image_to_video' => 'img2vid_basic.json',
            default => 'txt2img_basic.json',
        };
    }

    public static function replacements(array $context): array
    {
        $ratio = $context['ratio'] ?? '1:1';
        [$width, $height] = self::ratioToDimensions($ratio, $context['resolution'] ?? null);

        return [
            '{{PROMPT}}' => (string) ($context['prompt'] ?? ''),
            '{{NEGATIVE_PROMPT}}' => (string) ($context['negative_prompt'] ?? ''),
            '{{JOB_ID}}' => (string) ($context['job_id'] ?? ''),
            '{{SEED}}' => (string) ($context['seed'] ?? random_int(1, 2147483647)),
            '{{WIDTH}}' => (string) $width,
            '{{HEIGHT}}' => (string) $height,
            '{{INPUT_IMAGE}}' => (string) ($context['input_image'] ?? ''),
            '{{STEPS}}' => (string) ($context['steps'] ?? 20),
            '{{CFG}}' => (string) ($context['cfg'] ?? 7),
            '{{DENOISE}}' => (string) ($context['denoise'] ?? 0.65),
            '{{FPS}}' => (string) ($context['fps'] ?? 8),
            '{{FRAMES}}' => (string) ($context['frames'] ?? 16),
        ];
    }

    public static function ratioToDimensions(string $ratio, ?string $resolution = null): array
    {
        if ($resolution && preg_match('/^(\d+)x(\d+)$/', $resolution, $m)) {
            return [(int) $m[1], (int) $m[2]];
        }

        return match ($ratio) {
            '16:9' => [1280, 720],
            '9:16' => [720, 1280],
            '3:4' => [864, 1152],
            '4:3' => [1152, 864],
            default => [1024, 1024],
        };
    }
}
