<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PromptHistoryStoreRequest;
use App\Models\PromptHistory;
use Illuminate\Http\Request;

class PromptHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        return response()->json(
            PromptHistory::query()->where('user_id', $user->id)->latest()->limit(50)->get()->map(fn (PromptHistory $item) => [
                'id' => $item->id,
                'source' => $item->source,
                'prompt' => $item->prompt,
                'type' => $item->type,
                'ratio' => $item->ratio,
                'seed' => $item->seed,
                'mediaId' => $item->media_item_id,
                'presetId' => $item->preset_id,
                'presetName' => $item->preset_name,
                'createdAt' => $item->created_at?->toISOString(),
            ])
        );
    }

    public function store(PromptHistoryStoreRequest $request)
    {
        $user = $request->user();
        $item = PromptHistory::create([
            'user_id' => $user->id,
            'source' => $request->validated('source'),
            'prompt' => $request->validated('prompt'),
            'type' => $request->validated('type'),
            'ratio' => $request->validated('ratio'),
            'seed' => $request->validated('seed'),
            'media_item_id' => $request->validated('mediaId'),
            'preset_id' => $request->validated('presetId'),
            'preset_name' => $request->validated('presetName'),
        ]);

        return response()->json(['id' => $item->id], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        PromptHistory::query()->where('user_id', $user->id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Prompt history deleted']);
    }
}
