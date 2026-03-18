<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaItemResource;
use App\Models\MediaStack;
use Illuminate\Http\Request;

class StackController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $stacks = MediaStack::query()->where('user_id', $user->id)->with('items')->latest('order_in_board')->get();

        return response()->json($stacks->map(fn (MediaStack $stack) => [
            'id' => $stack->id,
            'title' => $stack->title,
            'itemCount' => $stack->items->count(),
            'orderInBoard' => $stack->order_in_board,
            'items' => MediaItemResource::collection($stack->items)->resolve(),
        ]));
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $stack = MediaStack::query()->where('user_id', $user->id)->with('items')->findOrFail($id);

        return response()->json([
            'id' => $stack->id,
            'title' => $stack->title,
            'itemCount' => $stack->items->count(),
            'items' => MediaItemResource::collection($stack->items),
        ]);
    }
}
