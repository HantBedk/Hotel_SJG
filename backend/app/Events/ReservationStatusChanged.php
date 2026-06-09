<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Reservation $reservation) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('hotel.reservations')];
    }

    public function broadcastAs(): string
    {
        return 'reservation.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'reservation_id' => $this->reservation->id,
            'status'         => $this->reservation->status,
            'guest_name'     => $this->reservation->guest?->full_name,
            'room_id'        => $this->reservation->room_id,
            'start_date'     => $this->reservation->start_date?->toDateString(),
            'end_date'       => $this->reservation->end_date?->toDateString(),
        ];
    }
}
