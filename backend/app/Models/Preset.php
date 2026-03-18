<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Preset extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'category',
        'prompt',
        'ratio',
        'seed',
        'type',
        'is_system',
        'sort_order',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'seed' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function previewMedia()
    {
        return $this->belongsToMany(MediaItem::class, 'preset_preview_media', 'preset_id', 'media_item_id')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('preset_preview_media.position');
    }
}
