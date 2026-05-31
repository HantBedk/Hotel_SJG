<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Room $room) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('hotel.rooms')];
    }

    public function broadcastAs(): string
    {
        return 'room.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->room->id,
            'number'       => $this->room->number,
            'status'       => $this->room->status,
            'room_type_id' => $this->room->room_type_id,
        ];
    }
}
