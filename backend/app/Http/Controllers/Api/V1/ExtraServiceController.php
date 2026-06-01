<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use Illuminate\Http\JsonResponse;

class ExtraServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = ExtraService::where('active', true)->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $services]);
    }
}
