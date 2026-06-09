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

        // Ingresos de hoy por habitaciones ocupadas: acumulativo durante el día,
        // sólo se resetea al cierre. Una stay_room cuenta si:
        //   - sigue activa (is_active = true)
        //   - su estadía está activa/extendida, O hizo check-out HOY
        // No filtramos por check_in_date porque la fuente de verdad de "qué
        // habitaciones están generando ingreso AHORA" es el estado de la
        // estadía y el flag is_active del stay_room; gatear por check_in_date
        // dejaba fuera check-ins cuyo `check_in_date` quedó guardado como
        // mañana por un shift de timezone en el wizard.
        // Una habitación que se va hoy sigue sumando hoy (ya generó el ingreso
        // de la noche). Sólo deja de aparecer a partir de mañana.
        // Deduplicamos por room_id porque una misma habitación puede tener
        // múltiples stay_rooms activos por bugs de extensión/transferencia,
        // y el ingreso de esa habitación no debe contarse dos veces.
        $today          = today();
        $todayRoomRevenue = StayRoom::where('is_active', true)
            ->whereHas('stay', function ($q) use ($today) {
                $q->where(function ($qq) use ($today) {
                    $qq->whereIn('status', ['active', 'extended'])
                       ->orWhere(function ($q2) use ($today) {
                           $q2->where('status', 'checked_out')
                              ->whereDate('actual_check_out_datetime', '>=', $today);
                       });
                });
            })
            ->selectRaw('room_id, MAX(price_per_night) as price')
            ->groupBy('room_id')
            ->get()
            ->sum('price');

        return $this->success([
            'rooms_by_status' => $statusCounts,
            'total_rooms'     => $totalRooms,
            'occupied'        => $statusCounts['occupied'],
            'available'       => $statusCounts['available'],
            'cleaning'        => $statusCounts['cleaning'],
            'checkins_today'  => $checkinsToday,
            'active_stays'    => $activeStays,
            'pending_balance' => (float) $pendingBalance,
            'today_room_revenue' => (float) $todayRoomRevenue,
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

        // Una habitación física puede tener varios stay_rooms activos por bugs
        // de extensión/transferencia. Deduplicamos por room_id — mismo criterio
        // que se aplica en el cálculo de "today_room_revenue" arriba — para que
        // el chart no sobreestime ocupación contando dos veces la misma cama.
        $countOccupiedRooms = function ($date) use ($stayDateScope) {
            return StayRoom::where('is_active', true)
                ->whereDate('check_in_date', '<=', $date)
                ->whereHas('stay', fn ($q) => $stayDateScope($q, $date))
                ->distinct('room_id')
                ->count('room_id');
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
                    $roomDaysOccupied += $countOccupiedRooms($day);
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

                $occupied = $countOccupiedRooms($date);
                $rate     = $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 1) : 0;

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
