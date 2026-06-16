<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\RoomStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Support\RoomCleaningNotifier;
use App\Support\RoomMaintenanceNotifier;
use App\Support\RoomRepairOrderService;
use App\Support\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Room::with(['roomType', 'house', 'features'])
            ->withCount([
                'repairOrders as open_repair_orders_count' => fn ($q) => $q
                    ->whereIn('status', ['pending', 'in_progress']),
            ])
            ->active()
            ->ordered();

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

        $data['status'] = Room::STATUS_AVAILABLE;

        $room = Room::create($data);

        return $this->created($room->load(['roomType', 'house']), 'Habitación creada.');
    }

    public function show(Room $room): JsonResponse
    {
        return $this->success($room->load(['roomType', 'features']));
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
        $newStatus = $data['status'];

        RoomRepairOrderService::assertCanLeaveMaintenance($room, $newStatus);

        $room->update($data);

        if ($room->status === Room::STATUS_CLEANING && $oldStatus !== Room::STATUS_CLEANING) {
            RoomCleaningNotifier::notify(
                $room,
                self::cleaningMessage($oldStatus),
                $request->user()->id,
            );
        }

        if ($oldStatus === Room::STATUS_CLEANING && $room->status === Room::STATUS_AVAILABLE) {
            RoomCleaningNotifier::dismissForRoom($room->id);
        }

        if ($room->status === Room::STATUS_MAINTENANCE && $oldStatus !== Room::STATUS_MAINTENANCE) {
            RoomMaintenanceNotifier::notify(
                $room,
                $data['notes'] ?? 'Habitación en mantenimiento.',
                $request->user()->id,
            );
            RoomRepairOrderService::ensureForRoomMaintenance(
                $room,
                $data['notes'] ?? 'Habitación en mantenimiento.',
                $request->user()->id,
            );
        }

        if ($oldStatus === Room::STATUS_MAINTENANCE && $room->status !== Room::STATUS_MAINTENANCE) {
            RoomMaintenanceNotifier::dismissForRoom($room->id);
        }

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
            ->with('persona')
            ->get()
            ->sortBy(fn (User $u) => mb_strtolower($u->name ?? ''))
            ->values()
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name]);

        return $this->success($users);
    }

    private static function cleaningMessage(string $previousStatus): string
    {
        return match ($previousStatus) {
            Room::STATUS_OCCUPIED  => 'Liberada tras estadía. Pendiente de limpieza.',
            Room::STATUS_RESERVED  => 'Reserva finalizada. Pendiente de limpieza.',
            default                => 'Solicitud de limpieza registrada.',
        };
    }
}
