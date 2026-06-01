<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Stay;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $statusCounts = Room::active()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $allStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'blocked'];
        foreach ($allStatuses as $s) {
            $statusCounts[$s] = (int) ($statusCounts[$s] ?? 0);
        }

        $totalRooms   = array_sum($statusCounts);
        $activeStays  = Stay::where('status', 'active')->count();
        $checkinsToday = Stay::whereDate('check_in_datetime', today())->count();

        // Pending balance across all active stays
        $pendingBalance = Stay::where('status', 'active')
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
            ->value('balance');

        return $this->success([
            'rooms_by_status' => $statusCounts,
            'total_rooms'     => $totalRooms,
            'occupied'        => $statusCounts['occupied'],
            'available'       => $statusCounts['available'],
            'cleaning'        => $statusCounts['cleaning'],
            'checkins_today'  => $checkinsToday,
            'active_stays'    => $activeStays,
            'pending_balance' => (float) $pendingBalance,
        ]);
    }
}
