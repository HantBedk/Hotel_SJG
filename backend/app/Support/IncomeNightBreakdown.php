<?php

namespace App\Support;

use App\Models\Stay;
use App\Models\StayRoom;
use Illuminate\Support\Carbon;

class IncomeNightBreakdown
{
    public function __construct(
        private readonly StayRoomOccupancy $occupancy = new StayRoomOccupancy(),
    ) {}

    /**
     * @return array{nights: list<array<string, mixed>>, tonight: array<string, mixed>}
     */
    public function build(Carbon $from, Carbon $to): array
    {
        $rangeStayRooms = StayRoom::with([
            'room:id,number',
            'stay:id,guest_id,company_id,status,actual_check_out_datetime',
            'stay.guest:id,full_name',
            'stay.company:id,name',
        ])
            ->where('is_active', true)
            ->where('check_in_date', '<=', $to->toDateString())
            ->where('check_out_date', '>', $from->toDateString())
            ->whereHas('stay', function ($q) {
                $q->whereIn('status', Stay::REVENUE_STATUSES);
            })
            ->get();

        $nights = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dateStr = $d->toDateString();
            $occupied = $rangeStayRooms->filter(
                fn ($stayRoom) => $this->occupancy->isOccupiedOnDate($stayRoom, $dateStr),
            );

            $nightByRoom = $occupied->groupBy('room_id')->map(function ($items) {
                return $items->sortByDesc('price_per_night')->first();
            })->values();

            $nightRevenue = $nightByRoom->sum(fn ($stayRoom) => (float) $stayRoom->price_per_night);

            $nights[] = [
                'date'         => $dateStr,
                'rooms_count'  => $nightByRoom->count(),
                'room_revenue' => (float) $nightRevenue,
                'rooms'        => $nightByRoom->map(fn ($stayRoom) => $this->mapStayRoom($stayRoom))
                    ->sortBy('room_number')
                    ->values(),
            ];
        }

        $todayStr     = today()->toDateString();
        $tonightEntry = collect($nights)->firstWhere('date', $todayStr) ?? [
            'date'         => $todayStr,
            'rooms_count'  => 0,
            'room_revenue' => 0.0,
            'rooms'        => [],
        ];

        return [
            'nights'  => $nights,
            'tonight' => $tonightEntry,
        ];
    }

    private function mapStayRoom(StayRoom $stayRoom): array
    {
        return [
            'stay_room_id' => $stayRoom->id,
            'stay_id'      => $stayRoom->stay_id,
            'room_id'      => $stayRoom->room_id,
            'room_number'  => $stayRoom->room?->number,
            'guest_name'   => $stayRoom->stay?->guest?->full_name,
            'company_name' => $stayRoom->stay?->company?->name,
            'check_in'     => $stayRoom->check_in_date,
            'check_out'    => $stayRoom->check_out_date,
            'price'        => (float) $stayRoom->price_per_night,
            'status'       => $stayRoom->stay?->status,
        ];
    }
}
