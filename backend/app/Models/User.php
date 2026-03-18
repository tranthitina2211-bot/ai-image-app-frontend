<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function setting()
    {
        return $this->hasOne(UserSetting::class);
    }

    public function settings()
    {
        return $this->setting();
    }

    public function mediaStacks()
    {
        return $this->hasMany(MediaStack::class);
    }

    public function mediaItems()
    {
        return $this->hasMany(MediaItem::class);
    }

    public function favoriteMedia()
    {
        return $this->belongsToMany(MediaItem::class, 'favorite_media', 'user_id', 'media_item_id')
            ->withTimestamps();
    }

    public function collections()
    {
        return $this->hasMany(Collection::class);
    }

    public function presets()
    {
        return $this->hasMany(Preset::class);
    }

    public function promptHistories()
    {
        return $this->hasMany(PromptHistory::class);
    }

    public function generationJobs()
    {
        return $this->hasMany(GenerationJob::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(UserSubscription::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(UserSubscription::class)->where('status', 'active')->latestOfMany();
    }
}
