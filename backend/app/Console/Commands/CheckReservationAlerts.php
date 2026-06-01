<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Reservation;
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

        // Reservations starting today or tomorrow that are still pending/confirmed
        $upcoming = Reservation::with(['guest', 'room'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereIn('start_date', [$today, $tomorrow])
            ->get();

        if ($upcoming->isEmpty()) {
            $this->info('No upcoming reservations to alert.');
            return self::SUCCESS;
        }

        // Get all receptionists and admins to notify
        $staffIds = User::permission(['check_in', 'manage_reservations'])
            ->pluck('id');

        $alerted = 0;

        DB::transaction(function () use ($upcoming, $staffIds, $today, &$alerted) {
            foreach ($upcoming as $reservation) {
                $isToday = $reservation->start_date->toDateString() === $today;
                $label   = $isToday ? 'HOY' : 'mañana';
                $guest   = $reservation->guest?->full_name ?? 'Empresa';
                $room    = $reservation->room?->number ? "Hab. {$reservation->room->number}" : 'Sin habitación asignada';

                foreach ($staffIds as $userId) {
                    $alreadyNotified = Notification::where('user_id', $userId)
                        ->where('type', 'reservation_alert')
                        ->whereJsonContains('payload->reservation_id', $reservation->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($alreadyNotified) {
                        continue;
                    }

                    Notification::create([
                        'type'    => 'reservation_alert',
                        'title'   => "Reserva {$label}: {$guest}",
                        'message' => "{$room} · {$reservation->nights} noche(s) · Llega {$label}",
                        'payload' => [
                            'reservation_id' => $reservation->id,
                            'start_date'     => $reservation->start_date->toDateString(),
                        ],
                        'user_id' => $userId,
                    ]);

                    $alerted++;
                }
            }
        });

        $this->info("Created {$alerted} reservation alert notification(s).");

        return self::SUCCESS;
    }
}
