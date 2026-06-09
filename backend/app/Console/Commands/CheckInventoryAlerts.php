<?php

namespace App\Console\Commands;

use App\Models\InventoryItem;
use App\Models\AssetMaintenance;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CheckInventoryAlerts extends Command
{
    protected $signature   = 'inventory:check-alerts';
    protected $description = 'Check low stock, expiring products, and upcoming maintenances; create notifications.';

    public function handle(): int
    {
        $staffIds = User::permission('manage_inventory')->pluck('id');

        if ($staffIds->isEmpty()) {
            $this->info('No staff with manage_inventory permission found.');
            return self::SUCCESS;
        }

        $alerted = 0;

        DB::transaction(function () use ($staffIds, &$alerted) {
            // Low stock items — usa umbral global si está configurado, si no, el mínimo por ítem
            $globalThreshold = Setting::get('inventory.low_stock_threshold', null);

            $lowStockQuery = InventoryItem::where('active', true);
            if ($globalThreshold !== null) {
                $lowStockQuery->where('current_stock', '<=', (int) $globalThreshold);
            } else {
                $lowStockQuery->whereRaw('current_stock <= min_stock_threshold');
            }
            $lowStock = $lowStockQuery->get();

            foreach ($lowStock as $item) {
                $minLabel = $globalThreshold !== null
                    ? "Umbral global: {$globalThreshold}."
                    : "Mínimo por ítem: {$item->min_stock_threshold}.";

                foreach ($staffIds as $userId) {
                    $exists = Notification::where('user_id', $userId)
                        ->where('type', 'low_stock')
                        ->whereJsonContains('payload->item_id', $item->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($exists) continue;

                    Notification::create([
                        'type'       => 'low_stock',
                        'title'      => "Stock bajo: {$item->name}",
                        'message'    => "Quedan {$item->current_stock} unidad(es). {$minLabel}",
                        'payload'    => ['item_id' => $item->id, 'code' => $item->code],
                        'action_url' => '/inventory?tab=consumibles',
                        'user_id'    => $userId,
                    ]);
                    $alerted++;
                }
            }

            // Expiring in 7 days
            $expiring = InventoryItem::where('active', true)
                ->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<=', Carbon::now()->addDays(7))
                ->whereDate('expiry_date', '>=', today())
                ->get();

            foreach ($expiring as $item) {
                $days = (int) Carbon::today()->diffInDays($item->expiry_date);

                foreach ($staffIds as $userId) {
                    $exists = Notification::where('user_id', $userId)
                        ->where('type', 'expiring_product')
                        ->whereJsonContains('payload->item_id', $item->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($exists) continue;

                    Notification::create([
                        'type'       => 'expiring_product',
                        'title'      => "Próximo a vencer: {$item->name}",
                        'message'    => "Vence en {$days} día(s). Fecha: {$item->expiry_date->format('d/m/Y')}.",
                        'payload'    => ['item_id' => $item->id, 'expiry_date' => $item->expiry_date->toDateString()],
                        'action_url' => '/inventory?tab=consumibles',
                        'user_id'    => $userId,
                    ]);
                    $alerted++;
                }
            }

            // Upcoming maintenances in next 3 days
            $maintenances = AssetMaintenance::with('asset')
                ->where('status', 'pending')
                ->whereDate('scheduled_date', '>=', today())
                ->whereDate('scheduled_date', '<=', Carbon::now()->addDays(3))
                ->get();

            foreach ($maintenances as $maint) {
                $days  = (int) Carbon::today()->diffInDays($maint->scheduled_date);
                $label = $days === 0 ? 'HOY' : "en {$days} día(s)";

                foreach ($staffIds as $userId) {
                    $exists = Notification::where('user_id', $userId)
                        ->where('type', 'maintenance_due')
                        ->whereJsonContains('payload->maintenance_id', $maint->id)
                        ->whereDate('created_at', today())
                        ->exists();

                    if ($exists) continue;

                    Notification::create([
                        'type'       => 'maintenance_due',
                        'title'      => "Mantenimiento {$label}: {$maint->asset?->name}",
                        'message'    => "Programado para {$maint->scheduled_date->format('d/m/Y')}. {$maint->description}",
                        'payload'    => ['maintenance_id' => $maint->id, 'asset_id' => $maint->asset_id],
                        'action_url' => '/inventory?tab=mantenimientos',
                        'user_id'    => $userId,
                    ]);
                    $alerted++;
                }
            }
        });

        $this->info("Created {$alerted} inventory alert notification(s).");
        return self::SUCCESS;
    }
}
