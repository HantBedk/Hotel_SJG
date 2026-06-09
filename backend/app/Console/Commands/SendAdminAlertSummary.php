<?php

namespace App\Console\Commands;

use App\Models\AssetMaintenance;
use App\Models\InventoryItem;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendAdminAlertSummary extends Command
{
    protected $signature   = 'admin:alert-summary {--force : Ignora la verificación de horario configurado}';
    protected $description = 'Envía un resumen modal a los administradores en los horarios configurados (default 06:00 y 20:00).';

    public function handle(): int
    {
        if (!$this->option('force') && !$this->isAtConfiguredHour()) {
            $this->info('No es horario configurado; omitiendo.');
            return self::SUCCESS;
        }

        $adminIds = User::role(['admin', 'superadmin'])->pluck('id');
        if ($adminIds->isEmpty()) return self::SUCCESS;

        $lowStock = InventoryItem::where('active', true)
            ->whereRaw('current_stock <= min_stock_threshold')
            ->count();
        $expiring = InventoryItem::where('active', true)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [today(), today()->addDays(7)])
            ->count();
        $maintenances = AssetMaintenance::where('status', 'pending')
            ->whereBetween('scheduled_date', [today(), today()->addDays(3)])
            ->count();
        $expiredReservations = Reservation::whereIn('status', ['pending', 'confirmed'])
            ->where('start_date', '<', today())->count();
        $pendingBalance = (float) Stay::where('status', 'active')
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
            ->value('balance');

        $total = $lowStock + $expiring + $maintenances + $expiredReservations + ($pendingBalance > 0 ? 1 : 0);
        if ($total === 0) {
            $this->info('Sin alertas que reportar.');
            return self::SUCCESS;
        }

        $parts = [];
        if ($lowStock > 0)            $parts[] = "{$lowStock} producto(s) con stock bajo";
        if ($expiring > 0)            $parts[] = "{$expiring} próximos a vencer";
        if ($maintenances > 0)        $parts[] = "{$maintenances} mantenimiento(s) cercanos";
        if ($expiredReservations > 0) $parts[] = "{$expiredReservations} reserva(s) vencidas";
        if ($pendingBalance > 0)      $parts[] = '$' . number_format($pendingBalance, 0, ',', '.') . ' por cobrar';

        $message = implode(' · ', $parts);
        $title   = 'Resumen diario · ' . now()->format('H:i');

        foreach ($adminIds as $userId) {
            $alreadySent = Notification::where('user_id', $userId)
                ->where('type', 'admin_summary')
                ->whereDate('created_at', today())
                ->whereTime('created_at', '>=', now()->subHour())
                ->exists();

            if ($alreadySent) continue;

            Notification::create([
                'type'       => 'admin_summary',
                'title'      => $title,
                'message'    => $message,
                'severity'   => 'warning',
                'is_modal'   => true,
                'payload'    => [
                    'low_stock'           => $lowStock,
                    'expiring'            => $expiring,
                    'maintenances'        => $maintenances,
                    'expired_reservations'=> $expiredReservations,
                    'pending_balance'     => $pendingBalance,
                ],
                'action_url' => '/',
                'user_id'    => $userId,
            ]);
        }

        $this->info("Resumen enviado a {$adminIds->count()} admin(s).");
        return self::SUCCESS;
    }

    private function isAtConfiguredHour(): bool
    {
        $configured = (string) Setting::get('hotel.admin_alert_hours', '06:00,20:00');
        $hours = array_map('trim', explode(',', $configured));
        $now   = now()->format('H:i');

        foreach ($hours as $h) {
            if (!$h) continue;
            // Tolera ±5 min para que el cron horario lo dispare
            try {
                $target = Carbon::createFromFormat('H:i', $h);
                if (abs($target->diffInMinutes(now(), false)) <= 5) return true;
            } catch (\Throwable) { /* skip */ }
        }
        return false;
    }
}
