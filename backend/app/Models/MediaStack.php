<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaStack extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'root_media_item_id',
        'cover_media_item_id',
        'title',
        'source_type',
        'order_in_board',
        'item_count',
        'last_generated_at',
    ];

    protected $casts = [
        'last_generated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rootMediaItem()
    {
        return $this->belongsTo(MediaItem::class, 'root_media_item_id');
    }

    public function coverMediaItem()
    {
        return $this->belongsTo(MediaItem::class, 'cover_media_item_id');
    }

    public function items()
    {
        return $this->hasMany(MediaItem::class, 'media_stack_id')->orderBy('order_in_stack');
    }
}
