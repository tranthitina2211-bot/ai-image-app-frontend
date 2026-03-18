<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GenerationJobEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'generation_job_id',
        'event_type',
        'message',
        'payload',
        'occurred_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(GenerationJob::class, 'generation_job_id');
    }
}
