<?php

namespace App\Providers;

use App\Models\Collection;
use App\Models\GenerationJob;
use App\Models\MediaItem;
use App\Models\MediaStack;
use App\Policies\CollectionPolicy;
use App\Policies\GenerationJobPolicy;
use App\Policies\MediaItemPolicy;
use App\Policies\MediaStackPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        MediaItem::class => MediaItemPolicy::class,
        MediaStack::class => MediaStackPolicy::class,
        Collection::class => CollectionPolicy::class,
        GenerationJob::class => GenerationJobPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
