<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaItemResource;
use App\Models\MediaItem;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $items = $user->favoriteMedia()->latest('favorite_media.created_at')->get();
        return MediaItemResource::collection($items);
    }

    public function store(Request $request, string $mediaId)
    {
        $user = $request->user();
        MediaItem::query()->where('user_id', $user->id)->findOrFail($mediaId);
        $user->favoriteMedia()->syncWithoutDetaching([$mediaId]);
        return response()->json(['message' => 'Favorited']);
    }

    public function destroy(Request $request, string $mediaId)
    {
        $user = $request->user();
        $user->favoriteMedia()->detach($mediaId);
        return response()->json(['message' => 'Favorite removed']);
    }
}
