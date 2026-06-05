<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssetMaintenance;
use App\Models\InventoryItem;
use App\Models\Room;
use App\Models\Setting;
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
        $statuses   = ['active', 'extended', 'checked_out'];

        if ($period === 'monthly') {
            // Para cada uno de los últimos 12 meses calculamos el promedio diario
            // de habitaciones ocupadas. La fórmula previa dividía estadías entre
            // (rooms * días) y producía porcentajes minúsculos siempre.
            $points = 12;
            $rows   = [];
            for ($i = $points - 1; $i >= 0; $i--) {
                $monthStart  = Carbon::now()->startOfMonth()->subMonths($i);
                $monthEnd    = $monthStart->copy()->endOfMonth();
                $label       = $monthStart->translatedFormat('M Y');
                $daysInMonth = $monthStart->daysInMonth;

                // Estadías que se solapan con este mes; las iteramos día a día en PHP
                // para evitar 30 queries por mes.
                $stays = Stay::whereDate('check_in_datetime', '<=', $monthEnd)
                    ->whereDate('check_out_datetime', '>=', $monthStart)
                    ->whereIn('status', $statuses)
                    ->get(['check_in_datetime', 'check_out_datetime']);

                $roomDaysOccupied = 0;
                for ($day = $monthStart->copy(); $day <= $monthEnd; $day->addDay()) {
                    foreach ($stays as $s) {
                        if (
                            $s->check_in_datetime->startOfDay()  <= $day &&
                            $s->check_out_datetime->startOfDay() >= $day
                        ) {
                            $roomDaysOccupied++;
                        }
                    }
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

                // Usamos >= para que el día de check-out también cuente como ocupado
                // (un huésped que sale el 04/jun pasó la noche del 03→04 en el hotel,
                // así que ese día sigue contando). El criterio previo (>) hacía que
                // el último punto siempre cayera a 0%.
                $occupied = Stay::whereDate('check_in_datetime', '<=', $date)
                    ->whereDate('check_out_datetime', '>=', $date)
                    ->whereIn('status', $statuses)
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
