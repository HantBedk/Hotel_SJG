<?php

namespace App\Support;

use App\Models\RepairOrder;
use App\Models\Room;
use App\Support\RoomMaintenanceNotifier;

/** Vincula habitaciones en mantenimiento con órdenes de reparación operativas. */
class RoomRepairOrderService
{
    public static function hasOpenOrder(string $roomId): bool
    {
        return RepairOrder::query()
            ->where('room_id', $roomId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->exists();
    }

    /** Impide salir de mantenimiento mientras exista una orden abierta. */
    public static function assertCanLeaveMaintenance(Room $room, string $newStatus): void
    {
        if ($room->status !== Room::STATUS_MAINTENANCE || $newStatus === Room::STATUS_MAINTENANCE) {
            return;
        }

        if (! self::hasOpenOrder($room->id)) {
            return;
        }

        abort(422, 'Debe cerrar la orden de mantenimiento antes de liberar la habitación.');
    }

    /** Libera la habitación cuando ya no quedan órdenes abiertas. */
    public static function releaseIfMaintenanceResolved(Room $room): bool
    {
        if ($room->status !== Room::STATUS_MAINTENANCE || self::hasOpenOrder($room->id)) {
            return false;
        }

        $room->update(['status' => Room::STATUS_AVAILABLE]);
        RoomMaintenanceNotifier::dismissForRoom($room->id);

        return true;
    }

    public static function ensureForRoomMaintenance(Room $room, string $description, string $reportedBy): ?RepairOrder
    {
        $openOrder = RepairOrder::query()
            ->where('room_id', $room->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->first();

        if ($openOrder) {
            return $openOrder;
        }

        $text = trim($description) !== '' ? trim($description) : 'Mantenimiento de habitación.';

        return RepairOrder::create([
            'room_id'     => $room->id,
            'description' => $text,
            'reported_by' => $reportedBy,
        ]);
    }
}
