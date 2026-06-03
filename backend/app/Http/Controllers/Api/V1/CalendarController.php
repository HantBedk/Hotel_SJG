<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\StayRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CalendarController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start' => 'required|date',
            'end'   => 'required|date|after_or_equal:start',
        ]);

        $start = Carbon::parse($data['start'])->startOfDay();
        $end   = Carbon::parse($data['end'])->endOfDay();

        // All active rooms with their type and house
        $rooms = Room::with(['roomType', 'house'])
            ->active()
            ->orderBy('number')
            ->get()
            ->map(fn($r) => [
                'id'        => $r->id,
                'number'    => $r->number,
                'status'    => $r->status,
                'room_type' => $r->roomType?->name,
                'house'     => $r->house?->name,
            ]);

        // Reservations overlapping the range
        $reservations = Reservation::with(['guest', 'company', 'room'])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where('start_date', '<', $end->toDateString())
            ->where('end_date', '>', $start->toDateString())
            ->get()
            ->map(fn($res) => [
                'id'           => $res->id,
                'type'         => 'reservation',
                'room_id'      => $res->room_id,
                'house_id'     => $res->house_id,
                'status'       => $res->status,
                'start_date'   => $res->start_date->toDateString(),
                'end_date'     => $res->end_date->toDateString(),
                'nights'       => $res->nights,
                'guest_name'   => $res->guest?->full_name,
                'company_name' => $res->company?->name,
                'agreed_price' => $res->agreed_price,
                'group_id'     => $res->group_id,
            ]);

        // Active stay rooms overlapping the range
        $stayRooms = StayRoom::with(['stay.guest', 'stay.company', 'room'])
            ->where('is_active', true)
            ->where('check_in_date', '<', $end->toDateString())
            ->where('check_out_date', '>', $start->toDateString())
            ->whereHas('stay', fn($q) => $q->whereIn('status', ['active', 'extended']))
            ->get()
            ->map(fn($sr) => [
                'id'           => $sr->stay_id,
                'type'         => 'stay',
                'room_id'      => $sr->room_id,
                'house_id'     => null,
                'status'       => $sr->stay->status,
                'start_date'   => $sr->check_in_date,
                'end_date'     => $sr->check_out_date,
                'nights'       => $sr->nights,
                'guest_name'   => $sr->stay->guest?->full_name,
                'company_name' => $sr->stay->company?->name,
                'agreed_price' => $sr->subtotal,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'rooms'        => $rooms,
                'reservations' => $reservations,
                'stays'        => $stayRooms,
            ],
        ]);
    }
}
