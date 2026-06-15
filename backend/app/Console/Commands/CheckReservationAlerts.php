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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CheckReservationAlerts extends Command
{
    protected $signature   = 'reservations:check-alerts';
    protected $description = 'Detect upcoming reservations and create notifications for staff.';

    public function handle(): int
    {
        $today    = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $upcoming = $this->upcomingReservations($today, $tomorrow);
        $expired  = $this->expiredReservations($today);

        if ($upcoming->isEmpty() && $expired->isEmpty()) {
            $this->info('No reservation alerts to dispatch.');
            return self::SUCCESS;
        }

        $staffIds   = User::permission(['check_in', 'manage_reservations'])->pluck('id');
        $adminIds   = User::role(['admin', 'superadmin'])->pluck('id');
        $autoAssign = Setting::get('hotel.auto_assign_reservations', false);

        $alerted = 0;

        DB::transaction(function () use ($upcoming, $expired, $staffIds, $adminIds, $today, $autoAssign, &$alerted) {
            $alerted += $this->processUpcomingReservations($upcoming, $staffIds, $today, $autoAssign);
            $alerted += $this->processExpiredReservations($expired, $adminIds);
        });

        $this->info("Created {$alerted} reservation alert notification(s).");

        return self::SUCCESS;
    }

    private function upcomingReservations(string $today, string $tomorrow): Collection
    {
        return Reservation::with(['guest', 'room'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereIn('start_date', [$today, $tomorrow])
            ->get();
    }

    private function expiredReservations(string $today): Collection
    {
        return Reservation::with(['guest', 'room'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_date', '<', $today)
            ->get();
    }

    private function processUpcomingReservations(
        Collection $upcoming,
        Collection $staffIds,
        string $today,
        bool $autoAssign,
    ): int {
        $alerted = 0;

        foreach ($upcoming as $reservation) {
            $isToday      = $reservation->start_date->toDateString() === $today;
            $label        = $isToday ? 'HOY' : 'mañana';
            $guest        = $reservation->guest?->full_name ?? 'Empresa';
            $autoAssigned = $this->tryAutoAssignRoom($reservation, $autoAssign);
            $room         = $this->formatRoomLabel($reservation->fresh()->room?->number);

            $title   = $autoAssigned
                ? "Reserva auto-asignada {$label}: {$guest}"
                : "Reserva {$label}: {$guest}";
            $message = "{$room} · {$reservation->nights} noche(s) · Llega {$label}";

            $alerted += $this->notifyStaff(
                $staffIds,
                'reservation_alert',
                'reservation_id',
                $reservation->id,
                [
                    'title'      => $title,
                    'message'    => $message,
                    'severity'   => 'info',
                    'payload'    => [
                        'reservation_id' => $reservation->id,
                        'start_date'     => $reservation->start_date->toDateString(),
                        'auto_assigned'  => $autoAssigned,
                    ],
                    'action_url' => "/reservations?id={$reservation->id}",
                ],
            );
        }

        return $alerted;
    }

    private function tryAutoAssignRoom(Reservation $reservation, bool $autoAssign): bool
    {
        if (! $autoAssign || $reservation->room_id || $reservation->house_id) {
            return false;
        }

        $candidate = Room::where('status', 'available')
            ->whereDoesntHave('reservations', fn ($q) => $q
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->where('start_date', '<', $reservation->end_date->toDateString())
                ->where('end_date', '>', $reservation->start_date->toDateString())
            )
            ->first();

        if (! $candidate) {
            return false;
        }

        $reservation->update(['room_id' => $candidate->id]);
        $candidate->update(['status' => 'reserved']);
        broadcast(new RoomStatusChanged($candidate->refresh()))->toOthers();

        return true;
    }

    private function formatRoomLabel(?string $number): string
    {
        return $number ? "Hab. {$number}" : 'Sin habitación asignada';
    }

    private function processExpiredReservations(Collection $expired, Collection $adminIds): int
    {
        $alerted = 0;

        foreach ($expired as $reservation) {
            $guest = $reservation->guest?->full_name ?? 'Empresa';
            $room  = $reservation->room?->number ? "Hab. {$reservation->room->number}" : 's/Hab';

            $alerted += $this->notifyStaff(
                $adminIds,
                'reservation_expired',
                'reservation_id',
                $reservation->id,
                [
                    'title'      => "Reserva vencida: {$guest}",
                    'message'    => "{$room} · Inicio {$reservation->start_date->toDateString()} sin check-in. Revisa con el cliente.",
                    'severity'   => 'warning',
                    'payload'    => [
                        'reservation_id' => $reservation->id,
                        'start_date'     => $reservation->start_date->toDateString(),
                    ],
                    'action_url' => "/reservations?id={$reservation->id}",
                ],
            );
        }

        return $alerted;
    }

    private function notifyStaff(
        Collection $staffIds,
        string $type,
        string $payloadKey,
        int|string $payloadValue,
        array $data,
    ): int {
        $created = 0;

        foreach ($staffIds as $userId) {
            if ($this->notificationExistsToday($userId, $type, $payloadKey, $payloadValue)) {
                continue;
            }

            Notification::create([
                'type'       => $type,
                'title'      => $data['title'],
                'message'    => $data['message'],
                'severity'   => $data['severity'],
                'payload'    => $data['payload'],
                'action_url' => $data['action_url'],
                'user_id'    => $userId,
            ]);
            $created++;
        }

        return $created;
    }

    private function notificationExistsToday(
        int|string $userId,
        string $type,
        string $payloadKey,
        int|string $payloadValue,
    ): bool {
        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->whereJsonContains("payload->{$payloadKey}", $payloadValue)
            ->whereDate('created_at', today())
            ->exists();
    }
}
