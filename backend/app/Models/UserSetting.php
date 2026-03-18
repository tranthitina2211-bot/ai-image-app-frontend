<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'display_name',
        'gender',
        'birth_year',
        'phone',
        'avatar_url',
        'theme',
        'grid_size',
        'autoplay_video_preview',
        'confirm_before_delete',
        'default_ratio',
        'auto_open_result',
        'auto_save_prompt',
    ];

    protected $casts = [
        'birth_year' => 'integer',
        'autoplay_video_preview' => 'boolean',
        'confirm_before_delete' => 'boolean',
        'auto_open_result' => 'boolean',
        'auto_save_prompt' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
