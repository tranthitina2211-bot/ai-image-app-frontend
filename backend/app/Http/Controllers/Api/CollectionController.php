<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CollectionItemsAttachRequest;
use App\Http\Requests\CollectionItemsReorderRequest;
use App\Http\Requests\CollectionStoreRequest;
use App\Http\Requests\CollectionUpdateRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $collections = Collection::query()->where('user_id', $user->id)->with('mediaItems')->orderBy('sort_order')->get();
        return CollectionResource::collection($collections);
    }

    public function store(CollectionStoreRequest $request): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => $request->validated('name'),
            'sort_order' => (int) Collection::query()->where('user_id', $user->id)->max('sort_order') + 1,
        ]);

        return new CollectionResource($collection->load('mediaItems'));
    }

    public function show(Request $request, string $id): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->with('mediaItems')->findOrFail($id);
        return new CollectionResource($collection);
    }

    public function update(CollectionUpdateRequest $request, string $id): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->findOrFail($id);
        $collection->update($request->validated());
        return new CollectionResource($collection->load('mediaItems'));
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->findOrFail($id);
        $collection->delete();
        return response()->json(['message' => 'Collection deleted']);
    }

    public function attachItems(CollectionItemsAttachRequest $request, string $id): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->with('mediaItems')->findOrFail($id);
        $existingIds = $collection->mediaItems->pluck('id')->all();
        $position = $collection->mediaItems->max('pivot.position') ?? 0;

        $syncData = [];
        foreach ($request->validated('itemIds') as $itemId) {
            if (in_array($itemId, $existingIds, true)) {
                continue;
            }
            $syncData[$itemId] = ['position' => ++$position];
        }

        if ($syncData !== []) {
            $collection->mediaItems()->syncWithoutDetaching($syncData);
        }

        return new CollectionResource($collection->fresh()->load('mediaItems'));
    }

    public function detachItem(Request $request, string $id, string $mediaId): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->findOrFail($id);
        $collection->mediaItems()->detach($mediaId);
        return new CollectionResource($collection->fresh()->load('mediaItems'));
    }

    public function reorderItems(CollectionItemsReorderRequest $request, string $id): CollectionResource
    {
        $user = $request->user();
        $collection = Collection::query()->where('user_id', $user->id)->findOrFail($id);

        foreach ($request->validated('itemIds') as $index => $itemId) {
            $collection->mediaItems()->updateExistingPivot($itemId, ['position' => $index + 1]);
        }

        return new CollectionResource($collection->fresh()->load('mediaItems'));
    }
}
