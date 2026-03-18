<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaItem extends Model
{
    use HasFactory, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'media_stack_id',
        'source_job_id',
        'parent_media_item_id',
        'ghost_of_media_item_id',
        'kind',
        'type',
        'url',
        'storage_disk',
        'storage_path',
        'mime_type',
        'prompt',
        'negative_prompt',
        'ratio',
        'resolution',
        'seed',
        'favorite_count',
        'status',
        'progress',
        'order_in_stack',
        'order_in_board',
        'metadata',
        'generated_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'generated_at' => 'datetime',
        'progress' => 'integer',
        'seed' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function stack()
    {
        return $this->belongsTo(MediaStack::class, 'media_stack_id');
    }

    public function sourceJob()
    {
        return $this->belongsTo(GenerationJob::class, 'source_job_id');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_media_item_id');
    }

    public function ghostOf()
    {
        return $this->belongsTo(self::class, 'ghost_of_media_item_id');
    }

    public function favoritedByUsers()
    {
        return $this->belongsToMany(User::class, 'favorite_media', 'media_item_id', 'user_id')
            ->withTimestamps();
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class, 'collection_items', 'media_item_id', 'collection_id')
            ->withPivot('position')
            ->withTimestamps();
    }
}
