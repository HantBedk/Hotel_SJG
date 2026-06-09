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

        // ── Desglose por noche dentro del rango ──────────────────────────────
        // Misma lógica que el KPI del dashboard ("tonight"), pero replicada
        // por cada día D del rango. Una stay_room cuenta para la noche D si:
        //   - is_active = true (no fue desplazada por una transferencia)
        //   - check_in_date <= D < check_out_date (planeada para esa noche)
        //   - la stay sigue activa/extendida, O hizo check-out el día D o
        //     después (actual_check_out_datetime >= D). Usamos ">=" (no ">")
        //     para que un check-in y check-out el mismo día siga contando la
        //     noche pagada.
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
                $q->whereIn('status', ['active', 'extended', 'checked_out']);
            })
            ->get();

        $mapRoom = fn($sr) => [
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
        ];

        $nights = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dateStr = $d->toDateString();
            $occupied = $rangeStayRooms->filter(function ($sr) use ($dateStr) {
                if ($sr->check_in_date->format('Y-m-d') > $dateStr) return false;
                if ($sr->check_out_date->format('Y-m-d') <= $dateStr) return false;

                $status = $sr->stay?->status;
                if (in_array($status, ['active', 'extended'], true)) return true;
                if ($status === 'checked_out') {
                    $actual = $sr->stay?->actual_check_out_datetime;
                    return $actual && $actual->format('Y-m-d') >= $dateStr;
                }
                return false;
            });

            $nightByRoom = $occupied->groupBy('room_id')->map(function ($items) {
                return $items->sortByDesc('price_per_night')->first();
            })->values();

            $nightRevenue = $nightByRoom->sum(fn($sr) => (float) $sr->price_per_night);
            $nightDetail  = $nightByRoom->map($mapRoom)->sortBy('room_number')->values();

            $nights[] = [
                'date'         => $dateStr,
                'rooms_count'  => $nightByRoom->count(),
                'room_revenue' => (float) $nightRevenue,
                'rooms'        => $nightDetail,
            ];
        }

        // `tonight` = entrada de hoy en $nights (o vacía si hoy está fuera del rango).
        $todayStr     = today()->toDateString();
        $tonightEntry = collect($nights)->firstWhere('date', $todayStr) ?? [
            'date'         => $todayStr,
            'rooms_count'  => 0,
            'room_revenue' => 0.0,
            'rooms'        => [],
        ];

        // ── Periodo: pagos recibidos ────────────────────────────────────────
        $payments = Payment::active()
            ->whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
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
        $recentPayments = Payment::active()
            ->with(['stay.guest:id,full_name', 'stay.company:id,name', 'receptionist:id,name'])
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
                'room_revenue' => (float) $tonightEntry['room_revenue'],
                'rooms_count'  => (int) $tonightEntry['rooms_count'],
                'rooms'        => $tonightEntry['rooms'],
            ],
            'nights' => $nights,
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

        // Rango de un solo día → agrupamos por hora para que el gráfico sea útil.
        if ($from->isSameDay($to)) {
            $rows = Payment::active()
                ->selectRaw('HOUR(payment_date) as hour, SUM(amount) as total')
                ->whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
                ->groupBy('hour')
                ->orderBy('hour')
                ->get()
                ->keyBy('hour');

            $data = [];
            for ($h = 0; $h < 24; $h++) {
                $data[] = [
                    'date'  => sprintf('%s %02d:00', $from->toDateString(), $h),
                    'label' => sprintf('%02dh', $h),
                    'total' => (float) ($rows[$h]->total ?? 0),
                ];
            }

            return $this->success([
                'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'granularity' => 'hour',
                'data'        => $data,
            ]);
        }

        $rows = Payment::active()
            ->selectRaw('DATE(payment_date) as date, SUM(amount) as total')
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
            'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'granularity' => 'day',
            'data'        => $data,
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
                // Últimos 7 días terminando hoy → siempre 7 noches navegables.
                return [today()->subDays(6), today()];
            case 'month':
                // Mes en curso hasta hoy.
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
