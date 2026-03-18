<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PresetResource;
use App\Models\Preset;
use Illuminate\Http\Request;

class PresetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Preset::query()->with('previewMedia')->where(function ($q) use ($user) {
            $q->where('is_system', true)->orWhere('user_id', $user->id);
        })->orderBy('sort_order');

        if ($category = $request->string('category')->toString()) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        return PresetResource::collection($query->get());
    }

    public function show(Request $request, string $id): PresetResource
    {
        $user = $request->user();
        $preset = Preset::query()->with('previewMedia')->where(function ($q) use ($user) {
            $q->where('is_system', true)->orWhere('user_id', $user->id);
        })->findOrFail($id);

        return new PresetResource($preset);
    }
}
