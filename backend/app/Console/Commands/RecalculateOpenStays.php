<?php

namespace App\Console\Commands;

use App\Models\Stay;
use App\Support\StayNights;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RecalculateOpenStays extends Command
{
    protected $signature = 'stays:recalculate-open
                            {--dry-run : Muestra cambios sin guardarlos}';

    protected $description = 'Recalcula noches y montos de estadías abiertas (active/extended) por días calendario.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $stays = Stay::query()
            ->whereIn('status', Stay::OPEN_STATUSES)
            ->with(['guest', 'activeStayRooms.room'])
            ->orderBy('check_in_datetime')
            ->get();

        if ($stays->isEmpty()) {
            $this->info('No hay estadías abiertas.');

            return self::SUCCESS;
        }

        $updated = 0;

        DB::transaction(function () use ($stays, $dryRun, &$updated) {
            foreach ($stays as $stay) {
                if ($this->recalculateStay($stay, $dryRun)) {
                    $updated++;
                }
            }

            if ($dryRun) {
                DB::rollBack();
            }
        });

        $verb = $dryRun ? 'requieren corrección' : 'actualizadas';
        $this->info("{$updated} de {$stays->count()} estadía(s) abierta(s) {$verb}.");

        return self::SUCCESS;
    }

    private function recalculateStay(Stay $stay, bool $dryRun): bool
    {
        $nights       = StayNights::between($stay->check_in_datetime, $stay->check_out_datetime);
        $checkOutDate = Carbon::parse($stay->check_out_datetime)->toDateString();
        $roomLines    = [];

        foreach ($stay->activeStayRooms as $stayRoom) {
            $newSubtotal = round((float) $stayRoom->price_per_night * $nights, 2);
            $changed     = (int) $stayRoom->nights !== $nights
                || $stayRoom->check_out_date?->toDateString() !== $checkOutDate
                || ! $this->amountsEqual((float) $stayRoom->subtotal, $newSubtotal);

            if ($changed) {
                $roomLines[] = sprintf(
                    '  Hab. %s: %d → %d noches, $%s → $%s',
                    $stayRoom->room?->number ?? '?',
                    $stayRoom->nights,
                    $nights,
                    number_format((float) $stayRoom->subtotal, 0, ',', '.'),
                    number_format($newSubtotal, 0, ',', '.'),
                );
            }

            if (! $dryRun && $changed) {
                $stayRoom->update([
                    'check_out_date' => $checkOutDate,
                    'nights'         => $nights,
                    'subtotal'       => $newSubtotal,
                ]);
            }
        }

        $roomsTotal    = $stay->activeStayRooms->sum(fn ($sr) => round((float) $sr->price_per_night * $nights, 2));
        $servicesTotal = (float) $stay->services()->sum('total');
        $minibarTotal  = (float) $stay->minibarConsumptions()->sum('total');
        $newTotal      = round($roomsTotal + $servicesTotal + $minibarTotal, 2);
        $totalChanged  = ! $this->amountsEqual((float) $stay->total_amount, $newTotal);

        if ($roomLines === [] && ! $totalChanged) {
            return false;
        }

        $guestName = $stay->guest?->full_name ?? '—';
        $this->line("Estadía {$stay->id} ({$guestName})");

        foreach ($roomLines as $line) {
            $this->line($line);
        }

        if ($totalChanged) {
            $this->line(sprintf(
                '  Total: $%s → $%s',
                number_format((float) $stay->total_amount, 0, ',', '.'),
                number_format($newTotal, 0, ',', '.'),
            ));
        }

        if (! $dryRun && $totalChanged) {
            $stay->update(['total_amount' => $newTotal]);
        }

        return true;
    }

    private function amountsEqual(float $a, float $b): bool
    {
        return abs($a - $b) < 0.01;
    }
}
