<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Suggestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuggestionsController extends Controller
{
    public function index(): JsonResponse
    {
        $suggestions = Suggestion::where('dismissed', false)
            ->orderByDesc('confidence_score')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json(['success' => true, 'data' => $suggestions]);
    }

    public function dismiss(Request $request, Suggestion $suggestion): JsonResponse
    {
        $suggestion->update([
            'dismissed'    => true,
            'dismissed_by' => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Sugerencia descartada.']);
    }
}
