<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MinibarConsumption;
use App\Models\Payment;
use App\Models\StayRoom;
use App\Models\StayService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Módulo de Ingresos.
 *
 * Distinguimos dos conceptos distintos:
 *   - "Hoy" (devengado de habitaciones): mismas reglas que el KPI del dashboard.
 *     Las habitaciones que pasan la noche aquí ya generaron ingreso, aunque
 *     todavía no se haya cobrado.
 *   - "Periodo" (caja real): pagos efectivamente recibidos entre dos fechas,
 *     más los cargos devengados (servicios, minibar) en ese mismo rango.
 */
class IncomeController extends Controller
{
    use ApiResponse;

    public function summary(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveRange($request);

        // ── Devengado de habitaciones por noche, hoy ─────────────────────────
        // Misma lógica que el KPI del dashboard: no gateamos por check_in_date
        // porque el wizard de check-in puede haber guardado esa fecha shifteada
        // por timezone; lo correcto es confiar en stay.status + is_active.
        $today    = today();
        $tonightRooms = StayRoom::with(['room:id,number', 'stay.guest:id,full_name', 'stay.company:id,name'])
            ->where('is_active', true)
            ->whereHas('stay', function ($q) use ($today) {
                $q->where(function ($qq) use ($today) {
                    $qq->whereIn('status', ['active', 'extended'])
                       ->orWhere(function ($q2) use ($today) {
                           $q2->where('status', 'checked_out')
                              ->whereDate('actual_check_out_datetime', '>=', $today);
                       });
                });
            })
            ->get();

        // Deduplicar por room_id (misma habitación puede tener varios stay_rooms
        // tras transferencias/extensiones).
        $byRoom = $tonightRooms->groupBy('room_id')->map(function ($items) {
            return $items->sortByDesc('price_per_night')->first();
        })->values();

        $tonightRevenue = $byRoom->sum(fn($sr) => (float) $sr->price_per_night);
        $tonightDetail  = $byRoom->map(fn($sr) => [
            'stay_room_id' => $sr->id,
            'stay_id'      => $sr->stay_id,
            'room_id'      => $sr->room_id,
            'room_number'  => $sr->room?->number,
            'guest_name'   => $sr->stay?->guest?->full_name,
            'company_name' => $sr->stay?->company?->name,
            'check_in'     => $sr->check_in_date,
            'check_out'    => $sr->check_out_date,
            'price'        => (float) $sr->price_per_night,
            'status'       => $sr->stay?->status,
        ])->sortBy('room_number')->values();

        // ── Periodo: pagos recibidos ────────────────────────────────────────
        $payments = Payment::whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        $paymentsReceived = (float) (clone $payments)->sum('amount');
        $paymentsCount    = (clone $payments)->count();

        $paymentsByMethod = (clone $payments)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn($p) => [
                'method' => $p->payment_method,
                'count'  => (int) $p->count,
                'total'  => (float) $p->total,
            ]);

        // ── Periodo: cargos devengados ──────────────────────────────────────
        $servicesBilled = (float) StayService::whereBetween(
            'applied_at',
            [$from->copy()->startOfDay(), $to->copy()->endOfDay()],
        )->sum('total');

        $minibarBilled = (float) MinibarConsumption::whereBetween(
            'registered_at',
            [$from->copy()->startOfDay(), $to->copy()->endOfDay()],
        )->sum('total');

        // Habitaciones facturadas en el rango: stays cuyo check-in cayó dentro.
        // Tomamos la suma de price_per_night * nights de sus stay_rooms.
        $roomsBilled = (float) StayRoom::where('is_active', true)
            ->whereHas('stay', function ($q) use ($from, $to) {
                $q->whereBetween('check_in_datetime', [
                    $from->copy()->startOfDay(),
                    $to->copy()->endOfDay(),
                ]);
            })
            ->selectRaw('COALESCE(SUM(price_per_night * nights), 0) as total')
            ->value('total');

        // Recent payments del periodo (mostrar los 20 más recientes)
        $recentPayments = Payment::with(['stay.guest:id,full_name', 'stay.company:id,name', 'receptionist:id,name'])
            ->whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->orderByDesc('payment_date')
            ->limit(20)
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'stay_id'        => $p->stay_id,
                'amount'         => (float) $p->amount,
                'payment_method' => $p->payment_method,
                'payment_type'   => $p->payment_type,
                'paid_by'        => $p->paid_by,
                'payment_date'   => $p->payment_date,
                'notes'          => $p->notes,
                'guest_name'     => $p->stay?->guest?->full_name,
                'company_name'   => $p->stay?->company?->name,
                'receptionist'   => $p->receptionist?->name,
            ]);

        return $this->success([
            'period' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
                'days' => $from->diffInDays($to) + 1,
            ],
            'tonight' => [
                'room_revenue' => (float) $tonightRevenue,
                'rooms_count'  => $byRoom->count(),
                'rooms'        => $tonightDetail,
            ],
            'range' => [
                'payments_received' => $paymentsReceived,
                'payments_count'    => $paymentsCount,
                'services_billed'   => $servicesBilled,
                'minibar_billed'    => $minibarBilled,
                'rooms_billed'      => $roomsBilled,
                'total_billed'      => $roomsBilled + $servicesBilled + $minibarBilled,
            ],
            'payments_by_method' => $paymentsByMethod,
            'recent_payments'    => $recentPayments,
        ]);
    }

    public function daily(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveRange($request);

        $rows = Payment::selectRaw('DATE(payment_date) as date, SUM(amount) as total')
            ->whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $data = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $key = $d->toDateString();
            $data[] = [
                'date'  => $key,
                'label' => $d->translatedFormat('D d/M'),
                'total' => (float) ($rows[$key]->total ?? 0),
            ];
        }

        return $this->success([
            'period' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'data' => $data,
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(Request $request): array
    {
        $preset = $request->query('preset');

        switch ($preset) {
            case 'today':
                return [today(), today()];
            case 'week':
                return [today()->startOfWeek(), today()];
            case 'month':
                return [today()->startOfMonth(), today()];
            case 'last_30':
                return [today()->subDays(29), today()];
        }

        $from = $request->query('from');
        $to   = $request->query('to');

        try {
            $fromDate = $from ? Carbon::parse($from)->startOfDay() : today();
            $toDate   = $to   ? Carbon::parse($to)->endOfDay()     : today();
        } catch (\Throwable) {
            $fromDate = today();
            $toDate   = today();
        }

        if ($fromDate->gt($toDate)) {
            [$fromDate, $toDate] = [$toDate, $fromDate];
        }

        return [$fromDate, $toDate];
    }
}
