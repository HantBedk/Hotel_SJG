<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MinibarConsumption;
use App\Models\Payment;
use App\Models\StayRoom;
use App\Models\StayService;
use App\Support\IncomeNightBreakdown;
use App\Support\IncomeRangeResolver;
use App\Support\IncomeReportBuilder;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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

    public function __construct(
        private readonly IncomeRangeResolver $rangeResolver,
        private readonly IncomeNightBreakdown $nightBreakdown,
        private readonly IncomeReportBuilder $reportBuilder,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        [$from, $to] = $this->rangeResolver->resolve($request);
        $periodStart = $from->copy()->startOfDay();
        $periodEnd   = $to->copy()->endOfDay();

        $breakdown = $this->nightBreakdown->build($from, $to);

        $payments = Payment::active()->whereBetween('payment_date', [$periodStart, $periodEnd]);
        $paymentsReceived = (float) (clone $payments)->sum('amount');
        $paymentsCount    = (clone $payments)->count();

        $paymentsByMethod = (clone $payments)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($payment) => [
                'method' => $payment->payment_method,
                'count'  => (int) $payment->count,
                'total'  => (float) $payment->total,
            ]);

        $servicesBilled = (float) StayService::whereBetween('applied_at', [$periodStart, $periodEnd])->sum('total');
        $minibarBilled  = (float) MinibarConsumption::whereBetween('registered_at', [$periodStart, $periodEnd])->sum('total');

        $roomsBilled = (float) StayRoom::where('is_active', true)
            ->whereHas('stay', function ($q) use ($periodStart, $periodEnd) {
                $q->whereBetween('check_in_datetime', [$periodStart, $periodEnd]);
            })
            ->selectRaw('COALESCE(SUM(price_per_night * nights), 0) as total')
            ->value('total');

        $recentPayments = Payment::active()
            ->with(['stay.guest', 'stay.company:id,name', 'receptionist.persona'])
            ->whereBetween('payment_date', [$periodStart, $periodEnd])
            ->orderByDesc('payment_date')
            ->limit(20)
            ->get()
            ->map(fn ($payment) => [
                'id'             => $payment->id,
                'stay_id'        => $payment->stay_id,
                'amount'         => (float) $payment->amount,
                'payment_method' => $payment->payment_method,
                'payment_type'   => $payment->payment_type,
                'paid_by'        => $payment->paid_by,
                'payment_date'   => $payment->payment_date,
                'notes'          => $payment->notes,
                'guest_name'     => $payment->stay?->guest?->full_name,
                'company_name'   => $payment->stay?->company?->name,
                'receptionist'   => $payment->receptionist?->name,
            ]);

        return $this->success([
            'period' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
                'days' => $from->diffInDays($to) + 1,
            ],
            'tonight' => [
                'room_revenue' => (float) $breakdown['tonight']['room_revenue'],
                'rooms_count'  => (int) $breakdown['tonight']['rooms_count'],
                'rooms'        => $breakdown['tonight']['rooms'],
            ],
            'nights' => $breakdown['nights'],
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
        [$from, $to] = $this->rangeResolver->resolve($request);
        $periodStart = $from->copy()->startOfDay();
        $periodEnd   = $to->copy()->endOfDay();

        $payments = Payment::active()
            ->whereBetween('payment_date', [$periodStart, $periodEnd])
            ->get(['payment_date', 'amount']);

        if ($from->isSameDay($to)) {
            $byHour = $payments->groupBy(fn ($payment) => (int) $payment->payment_date->hour)
                ->map(fn ($group) => (float) $group->sum('amount'));

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

        $byDate = $payments->groupBy(fn ($payment) => $payment->payment_date->toDateString())
            ->map(fn ($group) => (float) $group->sum('amount'));

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
     * check-outs y transferencias de habitación.
     */
    public function report(Request $request): Response
    {
        [$from, $to] = $this->rangeResolver->resolve($request);
        $start = $from->copy()->startOfDay();
        $end   = $to->copy()->endOfDay();

        $movements = $this->reportBuilder->collectMovements($start, $end);
        $days      = $this->reportBuilder->buildDays($from, $to, $movements);
        $grand     = $this->reportBuilder->grandTotals($movements);
        $byMethod  = $this->reportBuilder->paymentsByMethod($movements['payments']);

        $html = view('pdf.income-report', $this->reportBuilder->viewData(
            $request,
            $from,
            $to,
            $days,
            $grand,
            $byMethod,
        ))->render();

        return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
