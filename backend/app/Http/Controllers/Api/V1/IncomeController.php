<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Hotel;
use App\Models\MinibarConsumption;
use App\Models\Payment;
use App\Models\RoomTransfer;
use App\Models\Setting;
use App\Models\Stay;
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

        // Traemos los pagos del rango y agrupamos en PHP. Evita HOUR()/DATE() de
        // MySQL, que no existen idénticas en PostgreSQL.
        $payments = Payment::active()
            ->whereBetween('payment_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->get(['payment_date', 'amount']);

        // Rango de un solo día → agrupamos por hora para que el gráfico sea útil.
        if ($from->isSameDay($to)) {
            $byHour = $payments->groupBy(fn($p) => (int) $p->payment_date->hour)
                ->map(fn($group) => (float) $group->sum('amount'));

            $data = [];
            for ($h = 0; $h < 24; $h++) {
                $data[] = [
                    'date'  => sprintf('%s %02d:00', $from->toDateString(), $h),
                    'label' => sprintf('%02dh', $h),
                    'total' => (float) ($byHour[$h] ?? 0),
                ];
            }

            return $this->success([
                'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'granularity' => 'hour',
                'data'        => $data,
            ]);
        }

        $byDate = $payments->groupBy(fn($p) => $p->payment_date->toDateString())
            ->map(fn($group) => (float) $group->sum('amount'));

        $data = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $key = $d->toDateString();
            $data[] = [
                'date'  => $key,
                'label' => $d->translatedFormat('D d/M'),
                'total' => (float) ($byDate[$key] ?? 0),
            ];
        }

        return $this->success([
            'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'granularity' => 'day',
            'data'        => $data,
        ]);
    }

    /**
     * Devuelve un HTML imprimible con TODOS los movimientos del rango,
     * agrupados día por día: pagos recibidos, pagos anulados, consumos de
     * minibar (registrados y anulados), servicios extra, check-ins,
     * check-outs y transferencias de habitación. Cada día se renderiza en
     * una página (page-break-before) para que al imprimir/guardar como PDF
     * cada fecha quede en su propia hoja.
     */
    public function report(Request $request): \Illuminate\Http\Response
    {
        [$from, $to] = $this->resolveRange($request);

        $start = $from->copy()->startOfDay();
        $end   = $to->copy()->endOfDay();

        // ── Recolectamos todos los movimientos del rango ────────────────────
        $payments = Payment::active()
            ->with(['stay.guest:id,full_name', 'stay.company:id,name', 'receptionist:id,name'])
            ->whereBetween('payment_date', [$start, $end])
            ->orderBy('payment_date')
            ->get();

        $cancelledPayments = Payment::cancelled()
            ->with([
                'stay.guest:id,full_name',
                'stay.company:id,name',
                'receptionist:id,name',
                'cancelledBy:id,name',
            ])
            ->whereBetween('cancelled_at', [$start, $end])
            ->orderBy('cancelled_at')
            ->get();

        // Los consumos vivos: todos los que existen en la tabla. Los anulados
        // ya no están aquí (se borran físicamente), viven solo en activity_logs.
        $minibarActive = MinibarConsumption::query()
            ->with([
                'stay.guest:id,full_name',
                'stay.company:id,name',
                'room:id,number',
                'registeredBy:id,name',
            ])
            ->whereBetween('registered_at', [$start, $end])
            ->orderBy('registered_at')
            ->get();

        // Los consumos anulados se borran físicamente; la única huella queda
        // en activity_logs. Leemos esa acción concreta para reconstruirlos.
        $minibarCancelled = ActivityLog::query()
            ->with('user:id,name')
            ->where('action', 'stay.minibar_cancelled')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get();

        $services = StayService::query()
            ->with([
                'stay.guest:id,full_name',
                'stay.company:id,name',
                'extraService:id,name',
                'appliedBy:id,name',
            ])
            ->whereBetween('applied_at', [$start, $end])
            ->orderBy('applied_at')
            ->get();

        $checkIns = Stay::query()
            ->with([
                'guest:id,full_name',
                'company:id,name',
                'stayRooms.room:id,number',
                'createdBy:id,name',
            ])
            ->whereBetween('check_in_datetime', [$start, $end])
            ->orderBy('check_in_datetime')
            ->get();

        $checkOuts = Stay::query()
            ->with([
                'guest:id,full_name',
                'company:id,name',
                'stayRooms.room:id,number',
            ])
            ->where('status', 'checked_out')
            ->whereBetween('actual_check_out_datetime', [$start, $end])
            ->orderBy('actual_check_out_datetime')
            ->get();

        $transfers = RoomTransfer::query()
            ->with([
                'stay.guest:id,full_name',
                'fromRoom:id,number',
                'toRoom:id,number',
                'transferredBy:id,name',
            ])
            ->whereBetween('transferred_at', [$start, $end])
            ->orderBy('transferred_at')
            ->get();

        // ── Agrupamos por día ───────────────────────────────────────────────
        $dayKey = fn($dt) => Carbon::parse($dt)->toDateString();

        $byDay = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $key = $d->toDateString();
            $byDay[$key] = [
                'date'              => $key,
                'carbon'            => $d->copy(),
                'payments'          => collect(),
                'cancelledPayments' => collect(),
                'minibar'           => collect(),
                'minibarCancelled'  => collect(),
                'services'          => collect(),
                'checkIns'          => collect(),
                'checkOuts'         => collect(),
                'transfers'         => collect(),
            ];
        }

        foreach ($payments as $p) {
            $k = $dayKey($p->payment_date);
            if (isset($byDay[$k])) $byDay[$k]['payments']->push($p);
        }
        foreach ($cancelledPayments as $p) {
            $k = $dayKey($p->cancelled_at);
            if (isset($byDay[$k])) $byDay[$k]['cancelledPayments']->push($p);
        }
        foreach ($minibarActive as $m) {
            $k = $dayKey($m->registered_at);
            if (isset($byDay[$k])) $byDay[$k]['minibar']->push($m);
        }
        foreach ($minibarCancelled as $log) {
            $k = $dayKey($log->created_at);
            if (isset($byDay[$k])) $byDay[$k]['minibarCancelled']->push($log);
        }
        foreach ($services as $s) {
            $k = $dayKey($s->applied_at);
            if (isset($byDay[$k])) $byDay[$k]['services']->push($s);
        }
        foreach ($checkIns as $s) {
            $k = $dayKey($s->check_in_datetime);
            if (isset($byDay[$k])) $byDay[$k]['checkIns']->push($s);
        }
        foreach ($checkOuts as $s) {
            $k = $dayKey($s->actual_check_out_datetime);
            if (isset($byDay[$k])) $byDay[$k]['checkOuts']->push($s);
        }
        foreach ($transfers as $t) {
            $k = $dayKey($t->transferred_at);
            if (isset($byDay[$k])) $byDay[$k]['transfers']->push($t);
        }

        // ── Totales por día ─────────────────────────────────────────────────
        foreach ($byDay as &$d) {
            $d['paymentsTotal']  = (float) $d['payments']->sum('amount');
            $d['paymentsCount']  = $d['payments']->count();
            $d['minibarTotal']   = (float) $d['minibar']->sum('total');
            $d['servicesTotal']  = (float) $d['services']->sum('total');
            $d['cancelledTotal'] = (float) $d['cancelledPayments']->sum('amount');
            $d['totalMovements'] = $d['payments']->count()
                + $d['cancelledPayments']->count()
                + $d['minibar']->count()
                + $d['minibarCancelled']->count()
                + $d['services']->count()
                + $d['checkIns']->count()
                + $d['checkOuts']->count()
                + $d['transfers']->count();
        }
        unset($d);
        $days = array_values($byDay);

        // ── Totales generales del rango ─────────────────────────────────────
        $grand = [
            'paymentsTotal'           => (float) $payments->sum('amount'),
            'paymentsCount'           => $payments->count(),
            'minibarTotal'            => (float) $minibarActive->sum('total'),
            'minibarCount'            => $minibarActive->count(),
            'servicesTotal'           => (float) $services->sum('total'),
            'servicesCount'           => $services->count(),
            'cancelledTotal'          => (float) $cancelledPayments->sum('amount'),
            'cancelledCount'          => $cancelledPayments->count(),
            'minibarCancelledCount'   => $minibarCancelled->count(),
            'checkInsCount'           => $checkIns->count(),
            'checkOutsCount'          => $checkOuts->count(),
            'transfersCount'          => $transfers->count(),
        ];

        // Pagos por método (totales del rango)
        $byMethod = $payments->groupBy('payment_method')->map(function ($g, $method) {
            return [
                'method' => $method,
                'count'  => $g->count(),
                'total'  => (float) $g->sum('amount'),
            ];
        })->values();

        $hotel      = Hotel::first();
        $hotelName  = $hotel?->name    ?? Setting::get('hotel_name', 'Hotel');
        $hotelPhone = $hotel?->phone   ?? Setting::get('hotel_phone', '');
        $hotelAddr  = $hotel?->address ?? Setting::get('hotel_address', '');

        $preset = $request->query('preset');
        $presetLabels = [
            'today'   => 'Hoy',
            'week'    => 'Últimos 7 días',
            'month'   => 'Mes en curso',
            'last_30' => 'Últimos 30 días',
        ];
        $rangeLabel = $from->isSameDay($to)
            ? $from->translatedFormat('l, d \d\e F \d\e Y')
            : $from->translatedFormat('d/m/Y') . ' — ' . $to->translatedFormat('d/m/Y');
        $presetLabel = $presetLabels[$preset] ?? 'Personalizado';

        $generatedBy = $request->user()?->name ?? '—';

        $html = view('pdf.income-report', [
            'hotelName'   => $hotelName,
            'hotelPhone'  => $hotelPhone,
            'hotelAddr'   => $hotelAddr,
            'rangeLabel'  => $rangeLabel,
            'presetLabel' => $presetLabel,
            'from'        => $from,
            'to'          => $to,
            'generatedBy' => $generatedBy,
            'days'        => $days,
            'grand'       => $grand,
            'byMethod'    => $byMethod,
        ])->render();

        return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
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
