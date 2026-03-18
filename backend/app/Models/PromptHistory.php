<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromptHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'source',
        'prompt',
        'type',
        'ratio',
        'seed',
        'media_item_id',
        'preset_id',
        'preset_name',
    ];

    protected $casts = [
        'seed' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mediaItem()
    {
        return $this->belongsTo(MediaItem::class);
    }

    public function preset()
    {
        return $this->belongsTo(Preset::class);
    }
}
