<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\StayRoom;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Detecta "habitaciones zombie": rooms.status dice ocupada/reservada pero no
 * hay estadía/reserva real que lo respalde (típicamente porque el check-out
 * no se hizo correctamente). Crea notificaciones para que el admin/recepción
 * lo vea en el widget "Alertas activas" del dashboard.
 */
class CheckRoomConsistency extends Command
{
    protected $signature   = 'rooms:check-consistency';
    protected $description = 'Detecta habitaciones cuyo estado no coincide con estadías/reservas reales y crea alertas.';

    public function handle(): int
    {
        $staffIds = $this->alertRecipientIds();

        if ($staffIds->isEmpty()) {
            $this->info('No hay personal con permisos para recibir alertas.');
            return self::SUCCESS;
        }

        $today   = today()->toDateString();
        $alerted = 0;

        DB::transaction(function () use ($staffIds, $today, &$alerted) {
            foreach (Room::whereIn('status', ['occupied', 'reserved'])->get() as $room) {
                if ($this->roomIsConsistent($room, $today)) {
                    continue;
                }

                $alerted += $this->notifyRoomInconsistency($room, $staffIds);
            }
        });

        $this->info("Creadas {$alerted} alerta(s) de inconsistencia.");
        return self::SUCCESS;
    }

    private function alertRecipientIds(): Collection
    {
        return User::permission('manage_reservations')->pluck('id')
            ->merge(User::role(['admin', 'superadmin'])->pluck('id'))
            ->unique()
            ->values();
    }

    private function roomIsConsistent(Room $room, string $today): bool
    {
        return $this->hasActiveStay($room, $today)
            || $this->hasActiveReservation($room, $today);
    }

    private function hasActiveStay(Room $room, string $today): bool
    {
        return StayRoom::where('room_id', $room->id)
            ->where('is_active', true)
            ->where('check_in_date', '<=', $today)
            ->where('check_out_date', '>', $today)
            ->whereHas('stay', fn ($q) => $q->whereIn('status', ['active', 'extended']))
            ->exists();
    }

    private function hasActiveReservation(Room $room, string $today): bool
    {
        return Reservation::where('room_id', $room->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_date', '<=', $today)
            ->where('end_date', '>', $today)
            ->exists();
    }

    private function notifyRoomInconsistency(Room $room, Collection $staffIds): int
    {
        $expectedReason = $room->status === 'occupied' ? 'estadía activa' : 'reserva vigente';
        $created        = 0;

        foreach ($staffIds as $userId) {
            if ($this->notificationExistsToday($userId, $room->id)) {
                continue;
            }

            Notification::create([
                'type'       => 'room_inconsistency',
                'severity'   => 'warning',
                'title'      => "Habitación {$room->number}: estado inconsistente",
                'message'    => "Marcada como «{$room->status}» pero no hay {$expectedReason}. Revisá si quedó un check-out sin hacer.",
                'payload'    => [
                    'room_id'     => $room->id,
                    'room_number' => $room->number,
                    'room_status' => $room->status,
                    'detected_at' => now()->toIso8601String(),
                ],
                'action_url' => '/stays',
                'user_id'    => $userId,
            ]);
            $created++;
        }

        return $created;
    }

    private function notificationExistsToday(int|string $userId, int|string $roomId): bool
    {
        return Notification::where('user_id', $userId)
            ->where('type', 'room_inconsistency')
            ->whereJsonContains('payload->room_id', $roomId)
            ->whereDate('created_at', today())
            ->exists();
    }
}
