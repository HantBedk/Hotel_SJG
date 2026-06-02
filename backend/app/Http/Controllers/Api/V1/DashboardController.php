<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Stay;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

    public function occupancyHistory(Request $request): JsonResponse
    {
        $period = $request->query('period', 'weekly');

        if ($period === 'monthly') {
            $points = 12;
            $rows   = [];
            for ($i = $points - 1; $i >= 0; $i--) {
                $date  = Carbon::now()->startOfMonth()->subMonths($i);
                $label = $date->translatedFormat('M Y');
                $start = $date->copy()->startOfMonth();
                $end   = $date->copy()->endOfMonth();

                $totalRooms = Room::active()->count();
                $daysInMonth = $start->daysInMonth;

                $occupied = Stay::where('check_in_datetime', '<=', $end)
                    ->where('check_out_datetime', '>=', $start)
                    ->whereIn('status', ['active', 'extended', 'checked_out'])
                    ->count();

                $rate = $totalRooms > 0 ? round(($occupied / ($totalRooms * $daysInMonth)) * 100, 1) : 0;
                $rows[] = ['label' => $label, 'occupied' => $occupied, 'rate' => min(100, $rate)];
            }
        } else {
            $points = 7;
            $rows   = [];
            for ($i = $points - 1; $i >= 0; $i--) {
                $date  = Carbon::now()->subDays($i);
                $label = $date->translatedFormat('D d/M');

                $occupied = Stay::whereDate('check_in_datetime', '<=', $date)
                    ->whereDate('check_out_datetime', '>', $date)
                    ->whereIn('status', ['active', 'extended', 'checked_out'])
                    ->count();

                $totalRooms = Room::active()->count();
                $rate = $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 1) : 0;
                $rows[] = ['label' => $label, 'occupied' => $occupied, 'rate' => min(100, $rate)];
            }
        }

        return $this->success(['period' => $period, 'data' => $rows]);
    }
}
