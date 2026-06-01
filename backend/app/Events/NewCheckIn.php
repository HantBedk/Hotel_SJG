<?php

namespace App\Events;

use App\Models\Stay;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewCheckIn implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Stay $stay) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('hotel.rooms')];
    }

    public function broadcastAs(): string
    {
        return 'new.checkin';
    }

    public function broadcastWith(): array
    {
        return [
            'stay_id'    => $this->stay->id,
            'guest_name' => $this->stay->guest?->full_name,
            'room_ids'   => $this->stay->stayRooms->pluck('room_id'),
        ];
    }
}
