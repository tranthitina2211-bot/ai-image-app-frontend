<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'prompt' => $this->prompt,
            'ratio' => $this->ratio,
            'seed' => $this->seed,
            'type' => $this->type,
            'previewIds' => $this->whenLoaded('previewMedia', fn () => $this->previewMedia->pluck('id')->values()),
        ];
    }
}
