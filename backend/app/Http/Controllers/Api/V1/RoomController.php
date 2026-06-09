<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\RoomStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Room::with(['roomType', 'house'])
            ->active()
            ->orderByRaw("floor NULLS LAST, number");

        if ($request->has('status')) {
            $query->byStatus($request->query('status'));
        }

        return $this->success($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => ['required', 'uuid', 'exists:room_types,id'],
            'number'       => ['required', 'string', 'max:20'],
            'floor'        => ['nullable', 'integer', 'min:1', 'max:50'],
            'notes'        => ['nullable', 'string', 'max:500'],
        ]);

        $hotel = Hotel::firstOrFail();
        $data['hotel_id'] = $hotel->id;
        $data['status']   = 'available';

        $room = Room::create($data);

        ActivityLog::record('room_created', $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);

        return $this->created($room->load(['roomType', 'house']), 'Habitación creada.');
    }

    public function show(Room $room): JsonResponse
    {
        return $this->success($room->load('roomType'));
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => ['sometimes', 'uuid', 'exists:room_types,id'],
            'number'       => ['sometimes', 'string', 'max:20'],
            'floor'        => ['nullable', 'integer', 'min:1', 'max:50'],
            'notes'        => ['nullable', 'string', 'max:500'],
            'is_active'    => ['sometimes', 'boolean'],
        ]);

        $room->update($data);

        ActivityLog::record('room_updated', $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);

        return $this->success($room->load(['roomType', 'house']), 'Habitación actualizada.');
    }

    public function updateStatus(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:available,occupied,reserved,cleaning,maintenance,blocked'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);

        $oldStatus = $room->status;
        $room->update($data);

        $action = match($room->status) {
            'cleaning'    => 'room.cleaning',
            'maintenance' => 'room.maintenance',
            default       => 'room.status_changed',
        };
        ActivityLog::record($action, $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
            'old_status'  => $oldStatus,
            'new_status'  => $room->status,
        ]);

        broadcast(new RoomStatusChanged($room))->toOthers();

        return $this->success($room->load(['roomType', 'house']), 'Estado actualizado.');
    }

    public function destroy(Request $request, Room $room): JsonResponse
    {
        $room->update(['is_active' => false]);

        ActivityLog::record('room_deactivated', $request->user()->id, [
            'room_id'     => $room->id,
            'room_number' => $room->number,
        ]);

        return $this->noContent();
    }

    public function types(): JsonResponse
    {
        return $this->success(RoomType::orderBy('base_price')->get());
    }

    public function housekeepers(): JsonResponse
    {
        $users = User::role(['housekeeping', 'admin', 'superadmin'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name]);

        return $this->success($users);
    }
}
