<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\Nationality;
use App\Models\RoomFeature;
use App\Models\Season;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    public function getNationalities(): JsonResponse
    {
        $items = Nationality::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'iso_code', 'is_active', 'sort_order']);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function storeNationality(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:120|unique:nationalities,name',
            'iso_code'   => 'nullable|string|size:2|unique:nationalities,iso_code',
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active'  => 'sometimes|boolean',
        ]);

        $nationality = Nationality::create([
            'name'       => $data['name'],
            'iso_code'   => isset($data['iso_code']) ? strtoupper($data['iso_code']) : null,
            'sort_order' => $data['sort_order'] ?? 50,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return response()->json(['success' => true, 'data' => $nationality, 'message' => 'Nacionalidad creada.'], 201);
    }

    public function updateNationality(Request $request, Nationality $nationality): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:120|unique:nationalities,name,' . $nationality->id,
            'iso_code'   => 'nullable|string|size:2|unique:nationalities,iso_code,' . $nationality->id,
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active'  => 'sometimes|boolean',
        ]);

        if (array_key_exists('iso_code', $data) && $data['iso_code'] !== null) {
            $data['iso_code'] = strtoupper($data['iso_code']);
        }

        $nationality->update($data);

        return response()->json(['success' => true, 'data' => $nationality->fresh(), 'message' => 'Nacionalidad actualizada.']);
    }

    public function destroyNationality(Nationality $nationality): JsonResponse
    {
        if ($nationality->personas()->exists()) {
            $nationality->update(['is_active' => false]);

            return response()->json(['success' => true, 'message' => 'Nacionalidad desactivada (en uso por personas registradas).']);
        }

        $nationality->delete();

        return response()->json(['success' => true, 'message' => 'Nacionalidad eliminada.']);
    }

    public function getRoomFeatures(): JsonResponse
    {
        $items = RoomFeature::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active', 'sort_order']);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function storeRoomFeature(Request $request): JsonResponse
    {
        $hotelId = TenantContext::requireId();

        $data = $request->validate([
            'name'       => [
                'required', 'string', 'max:120',
                Rule::unique('room_features', 'name')->where('hotel_id', $hotelId),
            ],
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active'  => 'sometimes|boolean',
        ]);

        $feature = RoomFeature::create([
            'name'       => trim($data['name']),
            'sort_order' => $data['sort_order'] ?? 50,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return response()->json(['success' => true, 'data' => $feature, 'message' => 'Característica creada.'], 201);
    }

    public function updateRoomFeature(Request $request, RoomFeature $roomFeature): JsonResponse
    {
        $data = $request->validate([
            'name'       => [
                'sometimes', 'string', 'max:120',
                Rule::unique('room_features', 'name')
                    ->where('hotel_id', $roomFeature->hotel_id)
                    ->ignore($roomFeature->id),
            ],
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active'  => 'sometimes|boolean',
        ]);

        if (array_key_exists('name', $data)) {
            $data['name'] = trim($data['name']);
        }

        $roomFeature->update($data);

        return response()->json(['success' => true, 'data' => $roomFeature->fresh(), 'message' => 'Característica actualizada.']);
    }

    public function destroyRoomFeature(RoomFeature $roomFeature): JsonResponse
    {
        if ($roomFeature->rooms()->exists()) {
            $roomFeature->update(['is_active' => false]);

            return response()->json(['success' => true, 'message' => 'Característica desactivada (en uso por habitaciones).']);
        }

        $roomFeature->delete();

        return response()->json(['success' => true, 'message' => 'Característica eliminada.']);
    }
}
