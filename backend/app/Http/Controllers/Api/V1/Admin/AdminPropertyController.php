<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\House;
use App\Models\Room;
use App\Models\RoomType;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPropertyController extends Controller
{
    public function getRoomTypes(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => RoomType::orderBy('name')->get()]);
    }

    public function storeRoomType(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'description'   => 'nullable|string|max:500',
            'base_price'    => 'required|numeric|min:0',
            'max_occupancy' => 'required|integer|min:1|max:20',
            'amenities'     => 'nullable|array',
            'amenities.*'   => 'string|max:100',
        ]);

        $type = RoomType::create($data);

        return response()->json(['success' => true, 'data' => $type, 'message' => 'Tipo creado.'], 201);
    }

    public function updateRoomType(Request $request, RoomType $roomType): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'description'   => 'nullable|string|max:500',
            'base_price'    => 'sometimes|numeric|min:0',
            'max_occupancy' => 'sometimes|integer|min:1|max:20',
            'amenities'     => 'nullable|array',
            'amenities.*'   => 'string|max:100',
        ]);

        $roomType->update($data);

        return response()->json(['success' => true, 'data' => $roomType, 'message' => 'Tipo actualizado.']);
    }

    public function destroyRoomType(RoomType $roomType): JsonResponse
    {
        abort_if($roomType->rooms()->exists(), 409, 'No se puede eliminar un tipo con habitaciones asignadas.');
        $roomType->delete();

        return response()->json(['success' => true, 'message' => 'Tipo eliminado.']);
    }

    public function getHouses(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => House::with('rooms')->orderBy('name')->get()]);
    }

    public function storeHouse(Request $request): JsonResponse
    {
        $data  = $request->validate([
            'name'  => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
        ]);
        $house = House::create($data);

        return response()->json(['success' => true, 'data' => $house, 'message' => 'Casa creada.'], 201);
    }

    public function updateHouse(Request $request, House $house): JsonResponse
    {
        $data = $request->validate([
            'name'   => 'sometimes|string|max:100',
            'price'  => 'sometimes|numeric|min:0',
            'active' => 'sometimes|boolean',
        ]);
        $house->update($data);

        return response()->json(['success' => true, 'data' => $house->load('rooms'), 'message' => 'Casa actualizada.']);
    }

    public function destroyHouse(House $house): JsonResponse
    {
        $house->rooms()->update(['house_id' => null]);
        $house->delete();

        return response()->json(['success' => true, 'message' => 'Casa eliminada.']);
    }

    public function getAllRooms(): JsonResponse
    {
        $rooms = Room::with(['roomType', 'house'])->ordered()->get();

        return response()->json(['success' => true, 'data' => $rooms]);
    }

    public function storeRoom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'required|uuid|exists:room_types,id',
            'house_id'     => 'nullable|uuid|exists:houses,id',
            'number'       => [
                'required', 'string', 'max:20',
                Rule::unique('rooms', 'number')->where('hotel_id', TenantContext::requireId()),
            ],
            'floor'        => 'nullable|integer|min:1|max:50',
            'notes'        => 'nullable|string|max:500',
        ]);

        $data['status'] = 'available';
        $room           = Room::create($data);

        return response()->json(['success' => true, 'data' => $room->load(['roomType', 'house']), 'message' => 'Habitación creada.'], 201);
    }

    public function updateRoom(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'sometimes|uuid|exists:room_types,id',
            'house_id'     => 'nullable|uuid|exists:houses,id',
            'number'       => [
                'sometimes', 'string', 'max:20',
                Rule::unique('rooms', 'number')->where('hotel_id', $room->hotel_id)->ignore($room->id),
            ],
            'floor'        => 'nullable|integer|min:1|max:50',
            'notes'        => 'nullable|string|max:500',
            'is_active'    => 'sometimes|boolean',
        ]);

        $room->update($data);

        ActivityLog::record('room_updated', $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);

        return response()->json(['success' => true, 'data' => $room->load(['roomType', 'house']), 'message' => 'Habitación actualizada.']);
    }

    public function destroyRoom(Request $request, Room $room): JsonResponse
    {
        abort_if($room->status === 'occupied', 409, 'No se puede eliminar una habitación ocupada.');
        $room->update(['is_active' => false]);

        ActivityLog::record('room_deactivated', $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);

        return response()->json(['success' => true, 'message' => 'Habitación desactivada.']);
    }

    public function massUpdateRoomPrices(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'required|uuid|exists:room_types,id',
            'base_price'   => 'required|numeric|min:0',
        ]);

        $type = RoomType::findOrFail($data['room_type_id']);
        $type->update(['base_price' => $data['base_price']]);

        return response()->json([
            'success' => true,
            'data'    => $type,
            'message' => "Precio actualizado para tipo \"{$type->name}\".",
        ]);
    }
}
