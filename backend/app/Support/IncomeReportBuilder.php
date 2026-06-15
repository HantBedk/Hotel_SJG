<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\MinibarConsumption;
use App\Models\Payment;
use App\Models\RoomTransfer;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\StayService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class IncomeReportBuilder
{
    /**
     * @return array{
     *     payments: Collection,
     *     cancelledPayments: Collection,
     *     minibarActive: Collection,
     *     minibarCancelled: Collection,
     *     services: Collection,
     *     checkIns: Collection,
     *     checkOuts: Collection,
     *     transfers: Collection,
     * }
     */
    public function collectMovements(Carbon $start, Carbon $end): array
    {
        return [
            'payments' => Payment::active()
                ->with(['stay.guest:id,full_name', 'stay.company:id,name', 'receptionist:id,name'])
                ->whereBetween('payment_date', [$start, $end])
                ->orderBy('payment_date')
                ->get(),
            'cancelledPayments' => Payment::cancelled()
                ->with([
                    'stay.guest:id,full_name',
                    'stay.company:id,name',
                    'receptionist:id,name',
                    'cancelledBy:id,name',
                ])
                ->whereBetween('cancelled_at', [$start, $end])
                ->orderBy('cancelled_at')
                ->get(),
            'minibarActive' => MinibarConsumption::query()
                ->with([
                    'stay.guest:id,full_name',
                    'stay.company:id,name',
                    'room:id,number',
                    'registeredBy:id,name',
                ])
                ->whereBetween('registered_at', [$start, $end])
                ->orderBy('registered_at')
                ->get(),
            'minibarCancelled' => ActivityLog::query()
                ->with('user:id,name')
                ->where('action', 'stay.minibar_cancelled')
                ->whereBetween('created_at', [$start, $end])
                ->orderBy('created_at')
                ->get(),
            'services' => StayService::query()
                ->with([
                    'stay.guest:id,full_name',
                    'stay.company:id,name',
                    'extraService:id,name',
                    'appliedBy:id,name',
                ])
                ->whereBetween('applied_at', [$start, $end])
                ->orderBy('applied_at')
                ->get(),
            'checkIns' => Stay::query()
                ->with([
                    'guest:id,full_name',
                    'company:id,name',
                    'stayRooms.room:id,number',
                    'createdBy:id,name',
                ])
                ->whereBetween('check_in_datetime', [$start, $end])
                ->orderBy('check_in_datetime')
                ->get(),
            'checkOuts' => Stay::query()
                ->with([
                    'guest:id,full_name',
                    'company:id,name',
                    'stayRooms.room:id,number',
                ])
                ->where('status', 'checked_out')
                ->whereBetween('actual_check_out_datetime', [$start, $end])
                ->orderBy('actual_check_out_datetime')
                ->get(),
            'transfers' => RoomTransfer::query()
                ->with([
                    'stay.guest:id,full_name',
                    'fromRoom:id,number',
                    'toRoom:id,number',
                    'transferredBy:id,name',
                ])
                ->whereBetween('transferred_at', [$start, $end])
                ->orderBy('transferred_at')
                ->get(),
        ];
    }

    public function buildDays(Carbon $from, Carbon $to, array $movements): array
    {
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

        $this->assignReportItemsToDay($byDay, $movements['payments'], fn ($p) => $p->payment_date, 'payments');
        $this->assignReportItemsToDay($byDay, $movements['cancelledPayments'], fn ($p) => $p->cancelled_at, 'cancelledPayments');
        $this->assignReportItemsToDay($byDay, $movements['minibarActive'], fn ($m) => $m->registered_at, 'minibar');
        $this->assignReportItemsToDay($byDay, $movements['minibarCancelled'], fn ($log) => $log->created_at, 'minibarCancelled');
        $this->assignReportItemsToDay($byDay, $movements['services'], fn ($s) => $s->applied_at, 'services');
        $this->assignReportItemsToDay($byDay, $movements['checkIns'], fn ($s) => $s->check_in_datetime, 'checkIns');
        $this->assignReportItemsToDay($byDay, $movements['checkOuts'], fn ($s) => $s->actual_check_out_datetime, 'checkOuts');
        $this->assignReportItemsToDay($byDay, $movements['transfers'], fn ($t) => $t->transferred_at, 'transfers');

        foreach ($byDay as &$day) {
            $day['paymentsTotal']  = (float) $day['payments']->sum('amount');
            $day['paymentsCount']  = $day['payments']->count();
            $day['minibarTotal']   = (float) $day['minibar']->sum('total');
            $day['servicesTotal']  = (float) $day['services']->sum('total');
            $day['cancelledTotal'] = (float) $day['cancelledPayments']->sum('amount');
            $day['totalMovements'] = $day['payments']->count()
                + $day['cancelledPayments']->count()
                + $day['minibar']->count()
                + $day['minibarCancelled']->count()
                + $day['services']->count()
                + $day['checkIns']->count()
                + $day['checkOuts']->count()
                + $day['transfers']->count();
        }
        unset($day);

        return array_values($byDay);
    }

    public function grandTotals(array $movements): array
    {
        return [
            'paymentsTotal'         => (float) $movements['payments']->sum('amount'),
            'paymentsCount'         => $movements['payments']->count(),
            'minibarTotal'          => (float) $movements['minibarActive']->sum('total'),
            'minibarCount'          => $movements['minibarActive']->count(),
            'servicesTotal'         => (float) $movements['services']->sum('total'),
            'servicesCount'         => $movements['services']->count(),
            'cancelledTotal'        => (float) $movements['cancelledPayments']->sum('amount'),
            'cancelledCount'        => $movements['cancelledPayments']->count(),
            'minibarCancelledCount' => $movements['minibarCancelled']->count(),
            'checkInsCount'         => $movements['checkIns']->count(),
            'checkOutsCount'        => $movements['checkOuts']->count(),
            'transfersCount'        => $movements['transfers']->count(),
        ];
    }

    public function paymentsByMethod(Collection $payments): Collection
    {
        return $payments->groupBy('payment_method')->map(function ($group, $method) {
            return [
                'method' => $method,
                'count'  => $group->count(),
                'total'  => (float) $group->sum('amount'),
            ];
        })->values();
    }

    public function viewData(
        Request $request,
        Carbon $from,
        Carbon $to,
        array $days,
        array $grand,
        Collection $byMethod,
    ): array {
        $hotel        = TenantContext::hotel();
        $preset       = $request->query('preset');
        $presetLabels = [
            'today'   => 'Hoy',
            'week'    => 'Últimos 7 días',
            'month'   => 'Mes en curso',
            'last_30' => 'Últimos 30 días',
        ];

        return [
            'hotelName'   => $hotel?->name ?? Setting::get('hotel_name', 'Hotel'),
            'hotelPhone'  => $hotel?->phone ?? Setting::get('hotel_phone', ''),
            'hotelAddr'   => $hotel?->address ?? Setting::get('hotel_address', ''),
            'rangeLabel'  => $from->isSameDay($to)
                ? $from->translatedFormat('l, d \d\e F \d\e Y')
                : $from->translatedFormat('d/m/Y') . ' — ' . $to->translatedFormat('d/m/Y'),
            'presetLabel' => $presetLabels[$preset] ?? 'Personalizado',
            'from'        => $from,
            'to'          => $to,
            'generatedBy' => $request->user()?->name ?? '—',
            'days'        => $days,
            'grand'       => $grand,
            'byMethod'    => $byMethod,
        ];
    }

    private function assignReportItemsToDay(array &$byDay, iterable $items, callable $dateResolver, string $bucket): void
    {
        foreach ($items as $item) {
            $key = Carbon::parse($dateResolver($item))->toDateString();
            if (isset($byDay[$key])) {
                $byDay[$key][$bucket]->push($item);
            }
        }
    }
}
