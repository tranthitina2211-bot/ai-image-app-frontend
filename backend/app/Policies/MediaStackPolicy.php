<?php

namespace App\Policies;

use App\Models\MediaStack;
use App\Models\User;

class MediaStackPolicy
{
    public function view(User $user, MediaStack $mediaStack): bool
    {
        return $mediaStack->user_id === $user->id;
    }

    public function update(User $user, MediaStack $mediaStack): bool
    {
        return $mediaStack->user_id === $user->id;
    }
}
