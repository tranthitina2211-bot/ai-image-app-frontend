<?php

namespace App\Policies;

use App\Models\MediaItem;
use App\Models\User;

class MediaItemPolicy
{
    public function view(User $user, MediaItem $mediaItem): bool
    {
        return $mediaItem->user_id === $user->id;
    }

    public function update(User $user, MediaItem $mediaItem): bool
    {
        return $mediaItem->user_id === $user->id;
    }

    public function delete(User $user, MediaItem $mediaItem): bool
    {
        return $mediaItem->user_id === $user->id;
    }
}
