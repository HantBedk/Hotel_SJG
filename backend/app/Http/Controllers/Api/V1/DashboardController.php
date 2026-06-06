<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssetMaintenance;
use App\Models\InventoryItem;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\StayRoom;
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

        // "Check-ins hoy" = stays registrados hoy por el recepcionista
        // (no la fecha programada de entrada, que podría ser futura).
        $checkinsToday = Stay::whereDate('created_at', today())->count();

        // Pending balance across all active stays
        $pendingBalance = Stay::where('status', 'active')
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
            ->value('balance');

        // Inventory alerts
        $expiryDays = (int) Setting::get('inventory.expiry_alert_days', 7);
        $lowStock = InventoryItem::where('active', true)
            ->whereRaw('current_stock <= min_stock_threshold')
            ->count();
        $expiring = InventoryItem::where('active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [today(), today()->addDays($expiryDays)])
            ->count();
        $maintenancesSoon = AssetMaintenance::where('status', 'pending')
            ->whereBetween('scheduled_date', [today(), today()->addDays(3)])
            ->count();

        return $this->success([
            'rooms_by_status' => $statusCounts,
            'total_rooms'     => $totalRooms,
            'occupied'        => $statusCounts['occupied'],
            'available'       => $statusCounts['available'],
            'cleaning'        => $statusCounts['cleaning'],
            'checkins_today'  => $checkinsToday,
            'active_stays'    => $activeStays,
            'pending_balance' => (float) $pendingBalance,
            'inventory_alerts' => [
                'low_stock'         => $lowStock,
                'expiring'          => $expiring,
                'maintenances_soon' => $maintenancesSoon,
                'total'             => $lowStock + $expiring + $maintenancesSoon,
            ],
        ]);
    }

    public function occupancyHistory(Request $request): JsonResponse
    {
        $period     = $request->query('period', 'weekly');
        $totalRooms = Room::active()->count();

        // Una stay cubre un día $date si:
        //   check_in <= $date  AND  (real_out >= $date)
        // donde real_out es actual_check_out_datetime si la stay ya cerró
        // (status=checked_out) o check_out_datetime si sigue abierta. En esta
        // app, cuando un huésped sale antes de la fecha planificada, sólo se
        // setea actual_check_out_datetime — el check_out_datetime y las fechas
        // del stay_room quedan con la salida ORIGINAL, así que filtrar por esos
        // campos sobreestimaba la ocupación.
        $stayDateScope = function ($q, $date) {
            $q->whereDate('check_in_datetime', '<=', $date)
              ->where(function ($q2) use ($date) {
                  $q2->where(function ($q3) use ($date) {
                      $q3->whereIn('status', ['active', 'extended'])
                         ->whereDate('check_out_datetime', '>=', $date);
                  })->orWhere(function ($q3) use ($date) {
                      $q3->where('status', 'checked_out')
                         ->whereDate('actual_check_out_datetime', '>=', $date);
                  });
              });
        };

        if ($period === 'monthly') {
            $points = 12;
            $rows   = [];
            for ($i = $points - 1; $i >= 0; $i--) {
                $monthStart  = Carbon::now()->startOfMonth()->subMonths($i);
                $monthEnd    = $monthStart->copy()->endOfMonth();
                $label       = $monthStart->translatedFormat('M Y');
                $daysInMonth = $monthStart->daysInMonth;

                $roomDaysOccupied = 0;
                for ($day = $monthStart->copy(); $day <= $monthEnd; $day->addDay()) {
                    $roomDaysOccupied += StayRoom::where('is_active', true)
                        ->whereDate('check_in_date', '<=', $day)
                        ->whereHas('stay', fn ($q) => $stayDateScope($q, $day))
                        ->count();
                }

                $capacity = $totalRooms * $daysInMonth;
                $rate     = $capacity > 0
                    ? round(($roomDaysOccupied / $capacity) * 100, 1)
                    : 0;

                $rows[] = [
                    'label'    => $label,
                    'occupied' => $roomDaysOccupied,
                    'rate'     => min(100, $rate),
                ];
            }
        } else {
            $points = 7;
            $rows   = [];
            for ($i = $points - 1; $i >= 0; $i--) {
                $date  = Carbon::now()->subDays($i);
                $label = $date->translatedFormat('D d/M');

                $occupied = StayRoom::where('is_active', true)
                    ->whereDate('check_in_date', '<=', $date)
                    ->whereHas('stay', fn ($q) => $stayDateScope($q, $date))
                    ->count();

                $rate = $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 1) : 0;
                $rows[] = [
                    'label'    => $label,
                    'occupied' => $occupied,
                    'rate'     => min(100, $rate),
                ];
            }
        }

        return $this->success(['period' => $period, 'data' => $rows]);
    }
}
