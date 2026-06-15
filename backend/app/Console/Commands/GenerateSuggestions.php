<?php

namespace App\Console\Commands;

use App\Models\Hotel;
use App\Models\Suggestion;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateSuggestions extends Command
{
    protected $signature   = 'hotel:generate-suggestions';
    protected $description = 'Generate daily AI-like suggestions based on historical patterns';

    public function handle(): void
    {
        foreach (Hotel::orderBy('name')->get() as $hotel) {
            TenantContext::set($hotel->id);

            Suggestion::whereDate('created_at', today())
                ->where('dismissed', false)
                ->delete();

            $this->suggestMinibarRestock($hotel->id);
            $this->suggestPriceAdjustment($hotel->id);
            $this->suggestCorporateRates($hotel->id);
        }

        TenantContext::set(null);

        $this->info('Suggestions generated.');
    }

    private function suggestMinibarRestock(string $hotelId): void
    {
        $recurringGuests = DB::table('stays')
            ->join('minibar_consumptions', 'stays.id', '=', 'minibar_consumptions.stay_id')
            ->join('guests', 'stays.guest_id', '=', 'guests.id')
            ->select(
                'stays.guest_id',
                'guests.full_name',
                DB::raw('COUNT(DISTINCT stays.id) as stay_count'),
                DB::raw('SUM(minibar_consumptions.quantity) as total_items'),
                DB::raw("string_agg(DISTINCT minibar_consumptions.product_name, ', ') as products")
            )
            ->where('stays.hotel_id', $hotelId)
            ->where('stays.status', 'checked_out')
            ->groupBy('stays.guest_id', 'guests.full_name')
            ->having(DB::raw('COUNT(DISTINCT stays.id)'), '>=', 3)
            ->orderByDesc('stay_count')
            ->limit(5)
            ->get();

        foreach ($recurringGuests as $g) {
            $score = min(0.99, 0.5 + ($g->stay_count * 0.08));
            Suggestion::create([
                'type'             => 'minibar_restock',
                'title'            => "Reposición personalizada para {$g->full_name}",
                'description'      => "{$g->full_name} ha visitado {$g->stay_count} veces y consume frecuentemente: {$g->products}. Considera tener estos productos listos para su próxima estadía.",
                'confidence_score' => $score,
                'data'             => [
                    'guest_id'   => $g->guest_id,
                    'guest_name' => $g->full_name,
                    'stay_count' => $g->stay_count,
                    'products'   => $g->products,
                ],
            ]);
        }
    }

    private function suggestPriceAdjustment(string $hotelId): void
    {
        $totalRooms = DB::table('rooms')->where('hotel_id', $hotelId)->where('is_active', true)->count();

        if ($totalRooms === 0)
        {
            return;
        }

        $highDays = DB::table('stay_rooms')
            ->join('stays', 'stay_rooms.stay_id', '=', 'stays.id')
            ->select(
                DB::raw("EXTRACT(DOW FROM stay_rooms.check_in_date::date) as dow"),
                DB::raw('COUNT(*) as bookings')
            )
            ->where('stays.hotel_id', $hotelId)
            ->where('stays.status', 'checked_out')
            ->where('stay_rooms.created_at', '>=', now()->subMonths(3))
            ->groupBy('dow')
            ->havingRaw('COUNT(*) > ?', [intval($totalRooms * 0.6)])
            ->orderByDesc('bookings')
            ->first();

        if ($highDays) {
            $days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            $dow  = (int) $highDays->dow;
            $day  = $days[$dow] ?? "día $dow";
            Suggestion::create([
                'type'             => 'price_adjustment',
                'title'            => "Incrementar precio los {$day}s",
                'description'      => "Los {$day}s muestran alta demanda histórica ({$highDays->bookings} reservas en 3 meses). Considera aplicar un multiplicador de temporada para maximizar ingresos.",
                'confidence_score' => 0.72,
                'data'             => ['dow' => $dow, 'day_name' => $day, 'bookings' => $highDays->bookings],
            ]);
        }
    }

    private function suggestCorporateRates(string $hotelId): void
    {
        $companies = DB::table('stays')
            ->join('companies', 'stays.company_id', '=', 'companies.id')
            ->select(
                'stays.company_id',
                'companies.name as company_name',
                DB::raw('COUNT(*) as stay_count'),
                DB::raw('SUM(stays.total_amount) as total_revenue')
            )
            ->where('stays.hotel_id', $hotelId)
            ->whereNotNull('stays.company_id')
            ->where('stays.status', 'checked_out')
            ->groupBy('stays.company_id', 'companies.name')
            ->having(DB::raw('COUNT(*)'), '>=', 3)
            ->orderByDesc('stay_count')
            ->limit(3)
            ->get();

        foreach ($companies as $c) {
            $score = min(0.95, 0.6 + ($c->stay_count * 0.05));
            $avg   = $c->stay_count > 0 ? round((float) $c->total_revenue / $c->stay_count) : 0;
            Suggestion::create([
                'type'             => 'corporate_rate',
                'title'            => "Tarifa corporativa para {$c->company_name}",
                'description'      => "{$c->company_name} ha realizado {$c->stay_count} estadías con un gasto promedio de \${$avg} COP. Ofrecerles una tarifa corporativa podría fidelizar esta cuenta.",
                'confidence_score' => $score,
                'data'             => [
                    'company_id'    => $c->company_id,
                    'company_name'  => $c->company_name,
                    'stay_count'    => $c->stay_count,
                    'total_revenue' => $c->total_revenue,
                    'avg_stay'      => $avg,
                ],
            ]);
        }
    }
}
