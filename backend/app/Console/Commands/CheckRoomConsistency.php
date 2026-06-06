<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\StayRoom;
use App\Models\User;
use Illuminate\Console\Command;
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
        $staffIds = User::permission('manage_reservations')->pluck('id')
            ->merge(User::role(['admin', 'superadmin'])->pluck('id'))
            ->unique()
            ->values();

        if ($staffIds->isEmpty()) {
            $this->info('No hay personal con permisos para recibir alertas.');
            return self::SUCCESS;
        }

        $today = today()->toDateString();
        $alerted = 0;

        // Habitaciones marcadas como ocupadas o reservadas
        $suspects = Room::whereIn('status', ['occupied', 'reserved'])->get();

        DB::transaction(function () use ($suspects, $staffIds, $today, &$alerted) {
            foreach ($suspects as $room) {
                // ¿Hay estadía activa hoy?
                $hasActiveStay = StayRoom::where('room_id', $room->id)
                    ->where('is_active', true)
                    ->where('check_in_date', '<=', $today)
                    ->where('check_out_date', '>',  $today)
                    ->whereHas('stay', fn($q) => $q->whereIn('status', ['active', 'extended']))
                    ->exists();

                // ¿Hay reserva vigente hoy?
                $hasActiveReservation = Reservation::where('room_id', $room->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>',  $today)
                    ->exists();

                if ($hasActiveStay || $hasActiveReservation) {
                    continue; // Consistente
                }

                // Es un zombie. Crear notificación (una por día por usuario).
                $expectedReason = $room->status === 'occupied'
                    ? 'estadía activa'
                    : 'reserva vigente';

                foreach ($staffIds as $userId) {
                    $exists = Notification::where('user_id', $userId)
                        ->where('type', 'room_inconsistency')
                        ->whereJsonContains('payload->room_id', $room->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($exists) continue;

                    Notification::create([
                        'type'       => 'room_inconsistency',
                        'severity'   => 'warning',
                        'title'      => "Habitación {$room->number}: estado inconsistente",
                        'message'    => "Marcada como «{$room->status}» pero no hay {$expectedReason}. Revisá si quedó un check-out sin hacer.",
                        'payload'    => [
                            'room_id'       => $room->id,
                            'room_number'   => $room->number,
                            'room_status'   => $room->status,
                            'detected_at'   => now()->toIso8601String(),
                        ],
                        'action_url' => '/stays',
                        'user_id'    => $userId,
                    ]);
                    $alerted++;
                }
            }
        });

        $this->info("Creadas {$alerted} alerta(s) de inconsistencia.");
        return self::SUCCESS;
    }
}
