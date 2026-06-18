<?php

namespace App\Console\Commands;

use App\Models\Hotel;
use App\Models\Notification;
use App\Models\Room;
use App\Support\AlertRecipients;
use App\Support\RoomInconsistencyNotifier;
use App\Support\RoomStayResolver;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Detecta habitaciones cuyo estado no coincide con estadías/reservas reales.
 * Crea alertas para recepción/admin del hotel correspondiente.
 */
class CheckRoomConsistency extends Command
{
    protected $signature   = 'rooms:check-consistency';
    protected $description = 'Detecta habitaciones cuyo estado no coincide con estadías/reservas reales y crea alertas.';

    public function handle(): int
    {
        $today   = today();
        $alerted = 0;
        $healed  = 0;

        foreach (Hotel::orderBy('name')->get() as $hotel) {
            TenantContext::set($hotel->id);

            $staffIds = AlertRecipients::forHotel($hotel->id);
            if ($staffIds->isEmpty()) {
                $this->warn("Sin destinatarios para {$hotel->name}; se omiten alertas.");
                continue;
            }

            DB::transaction(function () use ($staffIds, $today, $hotel, &$alerted, &$healed) {
                foreach (Room::whereIn('status', ['occupied', 'reserved'])->get() as $room) {
                    if (RoomStayResolver::isConsistent($room, $today)) {
                        RoomInconsistencyNotifier::dismissForRoom($room->id);
                        $healed++;

                        continue;
                    }

                    $alerted += $this->notifyRoomInconsistency($room, $staffIds, $hotel->id);
                }
            });
        }

        TenantContext::set(null);

        $this->info("Creadas {$alerted} alerta(s) de inconsistencia; {$healed} habitación(es) saneada(s).");
        return self::SUCCESS;
    }

    private function notifyRoomInconsistency(Room $room, Collection $staffIds, string $hotelId): int
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
                    'hotel_id'    => $hotelId,
                    'detected_at' => now()->toIso8601String(),
                ],
                'action_url' => '/',
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
            ->where('is_read', false)
            ->whereJsonContains('payload->room_id', $roomId)
            ->exists();
    }
}
