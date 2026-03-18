<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $favoriteIds = $user ? $user->favoriteMedia()->pluck('media_items.id')->all() : [];

        return [
            'id' => $this->id,
            'kind' => $this->kind ?? 'media',
            'url' => $this->url,
            'type' => $this->type,
            'prompt' => $this->prompt,
            'ratio' => $this->ratio,
            'resolution' => $this->resolution,
            'seed' => $this->seed,
            'createdAt' => optional($this->generated_at ?? $this->created_at)?->toISOString(),
            'favorite' => in_array($this->id, $favoriteIds, true),
            'status' => $this->status,
            'progress' => $this->progress,
            'id_stack' => $this->media_stack_id,
            'order_in_stack' => $this->order_in_stack,
            'order_in_board' => $this->order_in_board,
            'jobId' => $this->source_job_id,
            'parentId' => $this->parent_media_item_id,
            'ghostOf' => $this->ghost_of_media_item_id,
        ];
    }
}
