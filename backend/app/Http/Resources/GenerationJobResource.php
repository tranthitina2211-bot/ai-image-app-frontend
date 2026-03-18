<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GenerationJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'mode' => $this->mode,
            'status' => $this->status,
            'progress' => $this->progress,
            'prompt' => $this->prompt,
            'ratio' => $this->ratio,
            'resolution' => $this->resolution,
            'seed' => $this->seed,
            'error' => $this->error_message,
            'queuedAt' => $this->queued_at?->toISOString(),
            'startedAt' => $this->started_at?->toISOString(),
            'finishedAt' => $this->finished_at?->toISOString(),
            'cancelledAt' => $this->cancelled_at?->toISOString(),
            'results' => MediaItemResource::collection($this->whenLoaded('mediaItems')),
        ];
    }
}
