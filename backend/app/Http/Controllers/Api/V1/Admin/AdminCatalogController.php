<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\Season;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCatalogController extends Controller
{
    public function getSeasons(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Season::orderBy('start_date')->get()]);
    }

    public function storeSeason(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'multiplier' => 'required|numeric|min:0.1|max:10',
            'active'     => 'sometimes|boolean',
        ]);

        $season = Season::create($data);

        return response()->json(['success' => true, 'data' => $season, 'message' => 'Temporada creada.'], 201);
    }

    public function updateSeason(Request $request, Season $season): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date|after:start_date',
            'multiplier' => 'sometimes|numeric|min:0.1|max:10',
            'active'     => 'sometimes|boolean',
        ]);

        $season->update($data);

        return response()->json(['success' => true, 'data' => $season, 'message' => 'Temporada actualizada.']);
    }

    public function destroySeason(Season $season): JsonResponse
    {
        $season->delete();

        return response()->json(['success' => true, 'message' => 'Temporada eliminada.']);
    }

    public function getExtraServices(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => ExtraService::orderBy('name')->get()]);
    }

    public function storeExtraService(Request $request): JsonResponse
    {
        $data    = $request->validate([
            'name'        => 'required|string|max:100',
            'price'       => 'required|numeric|min:0',
            'description' => 'nullable|string|max:300',
        ]);
        $service = ExtraService::create(array_merge($data, ['active' => true]));

        return response()->json(['success' => true, 'data' => $service, 'message' => 'Servicio creado.'], 201);
    }

    public function updateExtraService(Request $request, ExtraService $extraService): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'price'       => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:300',
            'active'      => 'sometimes|boolean',
        ]);
        $extraService->update($data);

        return response()->json(['success' => true, 'data' => $extraService, 'message' => 'Servicio actualizado.']);
    }

    public function destroyExtraService(ExtraService $extraService): JsonResponse
    {
        $extraService->update(['active' => false]);

        return response()->json(['success' => true, 'message' => 'Servicio desactivado.']);
    }
}
