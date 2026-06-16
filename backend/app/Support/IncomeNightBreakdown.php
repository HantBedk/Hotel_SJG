<?php

namespace App\Support;

use App\Models\Stay;
use App\Models\StayRoom;
use Illuminate\Support\Carbon;

class IncomeNightBreakdown
{
    public function __construct(
        private readonly StayRoomOccupancy $occupancy = new StayRoomOccupancy(),
        private readonly IncomeRoomPotential $roomPotential = new IncomeRoomPotential(),
    ) {}

    /**
     * @return array{nights: list<array<string, mixed>>, tonight: array<string, mixed>}
     */
    public function build(Carbon $from, Carbon $to): array
    {
        $rangeStayRooms = StayRoom::with([
            'room:id,number',
            'stay:id,person_id,company_id,status,check_in_datetime,check_out_datetime,actual_check_out_datetime',
            'stay.guest:id,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,document_type,document_number,phone',
            'stay.company:id,name',
        ])
            ->where('is_active', true)
            ->where('check_in_date', '<=', $to->toDateString())
            ->where('check_out_date', '>', $from->toDateString())
            ->whereHas('stay', function ($q) {
                $q->whereIn('status', Stay::REVENUE_STATUSES);
            })
            ->get();

        $inventory = $this->roomPotential->sellableInventory();
        $totalRooms = $inventory['total_rooms'];
        $potentialRevenue = $inventory['potential_revenue'];

        $nights = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dateStr = $d->toDateString();
            $occupied = $rangeStayRooms->filter(
                fn ($stayRoom) => $this->occupancy->isOccupiedOnDate($stayRoom, $dateStr),
            );

            $nightByRoom = $occupied->groupBy('room_id')->map(function ($items) {
                return $items->sortByDesc('price_per_night')->first();
            })->values();

            $roomsCount   = $nightByRoom->count();
            $nightRevenue = $nightByRoom->sum(fn ($stayRoom) => (float) $stayRoom->price_per_night);

            $nights[] = [
                'date'                     => $dateStr,
                'rooms_count'              => $roomsCount,
                'total_rooms'              => $totalRooms,
                'room_revenue'             => (float) $nightRevenue,
                'potential_revenue'        => $potentialRevenue,
                'occupancy_pct'            => $totalRooms > 0
                    ? round($roomsCount / $totalRooms * 100, 1)
                    : 0.0,
                'revenue_vs_potential_pct' => $potentialRevenue > 0
                    ? round($nightRevenue / $potentialRevenue * 100, 1)
                    : 0.0,
                'rooms'                    => $nightByRoom->map(fn ($stayRoom) => $this->mapStayRoom($stayRoom))
                    ->sortBy('room_number')
                    ->values(),
            ];
        }

        $todayStr     = today()->toDateString();
        $tonightEntry = collect($nights)->firstWhere('date', $todayStr) ?? [
            'date'                     => $todayStr,
            'rooms_count'              => 0,
            'total_rooms'              => $totalRooms,
            'room_revenue'             => 0.0,
            'potential_revenue'        => $potentialRevenue,
            'occupancy_pct'            => 0.0,
            'revenue_vs_potential_pct' => 0.0,
            'rooms'                    => [],
        ];

        return [
            'nights'  => $nights,
            'tonight' => $tonightEntry,
        ];
    }

    private function mapStayRoom(StayRoom $stayRoom): array
    {
        $stay  = $stayRoom->stay;
        $guest = $stay?->guest;
        $checkOutAt = $stay?->actual_check_out_datetime ?? $stay?->check_out_datetime;

        return [
            'stay_room_id'        => $stayRoom->id,
            'stay_id'             => $stayRoom->stay_id,
            'room_id'             => $stayRoom->room_id,
            'room_number'         => $stayRoom->room?->number,
            'guest_name'          => $guest?->full_name,
            'document_type'       => $guest?->document_type,
            'document_number'     => $guest?->document_number,
            'phone'               => $guest?->phone,
            'company_name'        => $stay?->company?->name,
            'check_in'            => $stayRoom->check_in_date,
            'check_out'           => $stayRoom->check_out_date,
            'check_in_datetime'   => $stay?->check_in_datetime,
            'check_out_datetime'  => $checkOutAt,
            'price'               => (float) $stayRoom->price_per_night,
            'status'              => $stay?->status,
        ];
    }
}
