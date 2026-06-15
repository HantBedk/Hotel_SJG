<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Nationality;
use Illuminate\Http\JsonResponse;

class NationalityController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Nationality::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'iso_code']);

        return response()->json(['success' => true, 'data' => $items]);
    }
}
