<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\MediaItem;
use App\Models\MediaStack;
use App\Models\Preset;
use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password'),
            ]
        );

        UserSetting::updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => 'Demo User',
                'email' => 'demo@example.com',
                'theme' => 'dark',
                'grid_size' => 'medium',
                'autoplay_video_preview' => true,
                'confirm_before_delete' => true,
                'default_ratio' => '1:1',
                'auto_open_result' => true,
                'auto_save_prompt' => true,
            ]
        );

        $stack = MediaStack::firstOrCreate(
            ['id' => 'stack-demo-1'],
            [
                'user_id' => $user->id,
                'title' => 'Demo stack',
                'source_type' => 'generate',
                'order_in_board' => now()->valueOf(),
                'item_count' => 2,
                'last_generated_at' => now(),
            ]
        );

        $items = [
            [
                'id' => 'demo-media-1',
                'type' => 'image',
                'prompt' => 'a cute cat, soft light',
                'ratio' => '1:1',
                'url' => 'https://picsum.photos/1080/1080?random=11',
                'order_in_stack' => 1,
            ],
            [
                'id' => 'demo-media-2',
                'type' => 'video',
                'prompt' => 'girl dancing, slow motion',
                'ratio' => '9:16',
                'url' => 'https://www.w3schools.com/html/mov_bbb.mp4',
                'order_in_stack' => 2,
            ],
        ];

        foreach ($items as $index => $data) {
            MediaItem::updateOrCreate(
                ['id' => $data['id']],
                [
                    'user_id' => $user->id,
                    'media_stack_id' => $stack->id,
                    'kind' => 'media',
                    'type' => $data['type'],
                    'prompt' => $data['prompt'],
                    'ratio' => $data['ratio'],
                    'url' => $data['url'],
                    'status' => 'success',
                    'progress' => 100,
                    'order_in_stack' => $data['order_in_stack'],
                    'order_in_board' => now()->valueOf(),
                    'generated_at' => now()->subDays($index),
                ]
            );
        }

        $coverId = 'demo-media-1';
        $stack->update([
            'root_media_item_id' => 'demo-media-1',
            'cover_media_item_id' => $coverId,
        ]);

        $collection = Collection::firstOrCreate(
            ['id' => 'collection-demo-1'],
            [
                'user_id' => $user->id,
                'name' => 'Favorites picks',
                'sort_order' => 1,
                'cover_media_item_id' => $coverId,
            ]
        );
        $collection->mediaItems()->syncWithoutDetaching([
            'demo-media-1' => ['position' => 1],
            'demo-media-2' => ['position' => 2],
        ]);

        $preset = Preset::firstOrCreate(
            ['id' => 'preset-demo-anime'],
            [
                'user_id' => null,
                'name' => 'Anime Portrait',
                'category' => 'anime',
                'prompt' => 'anime portrait, vibrant lighting, sharp eyes',
                'ratio' => '3:4',
                'type' => 'image',
                'is_system' => true,
                'sort_order' => 1,
            ]
        );
        $preset->previewMedia()->syncWithoutDetaching([
            'demo-media-1' => ['position' => 1],
        ]);

        $user->favoriteMedia()->syncWithoutDetaching(['demo-media-1']);
    }
}
