<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GenerationJob extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'media_stack_id',
        'parent_media_item_id',
        'action',
        'mode',
        'provider',
        'provider_job_id',
        'status',
        'progress',
        'prompt',
        'negative_prompt',
        'ratio',
        'resolution',
        'seed',
        'input_file_path',
        'error_message',
        'payload',
        'queued_at',
        'started_at',
        'finished_at',
        'cancelled_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'progress' => 'integer',
        'seed' => 'integer',
        'queued_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function stack()
    {
        return $this->belongsTo(MediaStack::class, 'media_stack_id');
    }

    public function parentMediaItem()
    {
        return $this->belongsTo(MediaItem::class, 'parent_media_item_id');
    }

    public function mediaItems()
    {
        return $this->hasMany(MediaItem::class, 'source_job_id');
    }

    public function events()
    {
        return $this->hasMany(GenerationJobEvent::class, 'generation_job_id')->latest('occurred_at');
    }
}
