<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'cover_media_item_id',
        'sort_order',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coverMediaItem()
    {
        return $this->belongsTo(MediaItem::class, 'cover_media_item_id');
    }

    public function mediaItems()
    {
        return $this->belongsToMany(MediaItem::class, 'collection_items', 'collection_id', 'media_item_id')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('collection_items.position');
    }
}
