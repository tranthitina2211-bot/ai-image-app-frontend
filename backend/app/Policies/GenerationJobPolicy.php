<?php

namespace App\Policies;

use App\Models\GenerationJob;
use App\Models\User;

class GenerationJobPolicy
{
    public function view(User $user, GenerationJob $generationJob): bool
    {
        return $generationJob->user_id === $user->id;
    }

    public function update(User $user, GenerationJob $generationJob): bool
    {
        return $generationJob->user_id === $user->id;
    }
}
