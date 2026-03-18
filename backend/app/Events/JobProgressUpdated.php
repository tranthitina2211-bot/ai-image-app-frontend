<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JobProgressUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $jobId,
        public array $payload
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel("job.{$this->jobId}");
    }

    public function broadcastAs(): string
    {
        return 'job.progress.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'jobId' => $this->jobId,
            ...$this->payload,
        ];
    }
}
