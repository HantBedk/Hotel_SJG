<?php

namespace App\Console\Commands;

use App\Events\RoomStatusChanged;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CheckReservationAlerts extends Command
{
    protected $signature   = 'reservations:check-alerts';
    protected $description = 'Detect upcoming reservations and create notifications for staff.';

    public function handle(): int
    {
        $tomorrow = Carbon::tomorrow()->toDateString();
        $today    = Carbon::today()->toDateString();

        $autoAssign = Setting::get('hotel.auto_assign_reservations', false);

        // Reservations starting today or tomorrow that are still pending/confirmed
        $upcoming = Reservation::with(['guest', 'room'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereIn('start_date', [$today, $tomorrow])
            ->get();

        // Reservations whose start date already passed without check-in (vencidas)
        $expired = Reservation::with(['guest', 'room'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_date', '<', $today)
            ->get();

        if ($upcoming->isEmpty() && $expired->isEmpty()) {
            $this->info('No reservation alerts to dispatch.');
            return self::SUCCESS;
        }

        $staffIds = User::permission(['check_in', 'manage_reservations'])->pluck('id');
        $adminIds = User::role(['admin', 'superadmin'])->pluck('id');

        $alerted = 0;

        DB::transaction(function () use ($upcoming, $expired, $staffIds, $adminIds, $today, $autoAssign, &$alerted) {
            // ── Upcoming ────────────────────────────────────────────────
            foreach ($upcoming as $reservation) {
                $isToday = $reservation->start_date->toDateString() === $today;
                $label   = $isToday ? 'HOY' : 'mañana';
                $guest   = $reservation->guest?->full_name ?? 'Empresa';

                // Auto-assignment attempt
                $autoAssigned = false;
                if ($autoAssign && !$reservation->room_id && !$reservation->house_id) {
                    $candidate = Room::where('status', 'available')
                        ->whereDoesntHave('reservations', fn($q) => $q
                            ->whereNotIn('status', ['cancelled', 'no_show'])
                            ->where('start_date', '<', $reservation->end_date->toDateString())
                            ->where('end_date', '>', $reservation->start_date->toDateString())
                        )
                        ->first();

                    if ($candidate) {
                        $reservation->update(['room_id' => $candidate->id]);
                        $candidate->update(['status' => 'reserved']);
                        broadcast(new RoomStatusChanged($candidate->refresh()))->toOthers();
                        $autoAssigned = true;
                    }
                }

                $room = $reservation->fresh()->room?->number
                    ? "Hab. " . $reservation->fresh()->room->number
                    : 'Sin habitación asignada';

                $title   = $autoAssigned
                    ? "Reserva auto-asignada {$label}: {$guest}"
                    : "Reserva {$label}: {$guest}";
                $message = "{$room} · {$reservation->nights} noche(s) · Llega {$label}";

                foreach ($staffIds as $userId) {
                    $alreadyNotified = Notification::where('user_id', $userId)
                        ->where('type', 'reservation_alert')
                        ->whereJsonContains('payload->reservation_id', $reservation->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($alreadyNotified) continue;

                    Notification::create([
                        'type'     => 'reservation_alert',
                        'title'    => $title,
                        'message'  => $message,
                        'severity' => 'info',
                        'payload'  => [
                            'reservation_id' => $reservation->id,
                            'start_date'     => $reservation->start_date->toDateString(),
                            'auto_assigned'  => $autoAssigned,
                        ],
                        'user_id'  => $userId,
                    ]);
                    $alerted++;
                }
            }

            // ── Expired (vencidas) — modal a admin, NO cancela automáticamente ──
            foreach ($expired as $reservation) {
                $guest = $reservation->guest?->full_name ?? 'Empresa';
                $room  = $reservation->room?->number ? "Hab. {$reservation->room->number}" : 's/Hab';

                foreach ($adminIds as $userId) {
                    $alreadyNotified = Notification::where('user_id', $userId)
                        ->where('type', 'reservation_expired')
                        ->whereJsonContains('payload->reservation_id', $reservation->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($alreadyNotified) continue;

                    Notification::create([
                        'type'     => 'reservation_expired',
                        'title'    => "Reserva vencida: {$guest}",
                        'message'  => "{$room} · Inicio {$reservation->start_date->toDateString()} sin check-in. Revisa con el cliente.",
                        'severity' => 'warning',
                        'payload'  => [
                            'reservation_id' => $reservation->id,
                            'start_date'     => $reservation->start_date->toDateString(),
                        ],
                        'user_id'  => $userId,
                    ]);
                    $alerted++;
                }
            }
        });

        $this->info("Created {$alerted} reservation alert notification(s).");

        return self::SUCCESS;
    }
}
