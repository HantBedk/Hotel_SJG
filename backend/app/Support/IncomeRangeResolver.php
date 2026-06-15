<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class IncomeRangeResolver
{
    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function resolve(Request $request): array
    {
        $today = today();

        [$fromDate, $toDate] = match ($request->query('preset')) {
            'today'   => [$today->copy(), $today->copy()],
            'week'    => [$today->copy()->subDays(6), $today->copy()],
            'month'   => [$today->copy()->startOfMonth(), $today->copy()],
            'last_30' => [$today->copy()->subDays(29), $today->copy()],
            default   => $this->parseCustomRange($request),
        };

        if ($fromDate->gt($toDate)) {
            [$fromDate, $toDate] = [$toDate, $fromDate];
        }

        return [$fromDate, $toDate];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function parseCustomRange(Request $request): array
    {
        $from = $request->query('from');
        $to   = $request->query('to');

        try {
            $fromDate = $from ? Carbon::parse($from)->startOfDay() : today();
            $toDate   = $to   ? Carbon::parse($to)->endOfDay()     : today();
        } catch (\Throwable) {
            return [today(), today()];
        }

        return [$fromDate, $toDate];
    }
}
