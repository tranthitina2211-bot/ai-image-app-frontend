<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaItemResource;
use App\Models\MediaItem;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = MediaItem::query()->where('user_id', $user->id)->latest('order_in_board')->latest();

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        if ($stackId = $request->string('stack_id')->toString()) {
            $query->where('media_stack_id', $stackId);
        }

        if ($date = $request->string('date')->toString()) {
            $query->whereDate('generated_at', $date);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where('prompt', 'like', '%' . $search . '%');
        }

        if ($request->boolean('favorite')) {
            $query->whereHas('favoritedByUsers', fn ($q) => $q->where('users.id', $user->id));
        }

        return MediaItemResource::collection($query->paginate((int) $request->integer('per_page', 24)));
    }

    public function show(Request $request, string $id): MediaItemResource
    {
        $user = $request->user();
        $item = MediaItem::query()->where('user_id', $user->id)->findOrFail($id);
        return new MediaItemResource($item);
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $item = MediaItem::query()->where('user_id', $user->id)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Media deleted']);
    }

    public function byDay(Request $request)
    {
        $user = $request->user();
        $items = MediaItem::query()
            ->where('user_id', $user->id)
            ->orderByDesc('generated_at')
            ->get()
            ->groupBy(fn (MediaItem $item) => optional($item->generated_at ?? $item->created_at)?->format('Y-m-d'))
            ->map(fn ($group, $dayKey) => [
                'dayKey' => $dayKey,
                'items' => MediaItemResource::collection($group)->resolve(),
            ])
            ->values();

        return response()->json($items);
    }
}
