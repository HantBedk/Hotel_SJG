<?php

namespace App\Console\Commands;

use App\Models\AssetMaintenance;
use App\Models\Hotel;
use App\Models\HotelInventory;
use App\Models\InventoryItem;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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

        foreach (Hotel::orderBy('name')->get() as $hotel) {
            TenantContext::set($hotel->id);
            $alerted += $this->checkHotel($staffIds, $hotel->id);
        }

        TenantContext::set(null);

        $this->info("Created {$alerted} inventory alert notification(s).");
        return self::SUCCESS;
    }

    private function checkHotel(Collection $staffIds, string $hotelId): int
    {
        $alerted = 0;

        DB::transaction(function () use ($staffIds, $hotelId, &$alerted) {
            $alerted += $this->processLowStockAlerts($staffIds, $hotelId);
            $alerted += $this->processExpiringProductAlerts($staffIds, $hotelId);
            $alerted += $this->processMaintenanceAlerts($staffIds, $hotelId);
        });

        return $alerted;
    }

    private function processLowStockAlerts(Collection $staffIds, string $hotelId): int
    {
        $globalThreshold = Setting::get('inventory.low_stock_threshold', null);
        $alerted         = 0;

        foreach ($this->lowStockInventories($hotelId, $globalThreshold) as $inv) {
            $item = $inv->inventoryItem;
            if (! $item) {
                continue;
            }

            $minLabel = $globalThreshold !== null
                ? "Umbral global: {$globalThreshold}."
                : "Mínimo por ítem: {$inv->min_stock_threshold}.";

            $alerted += $this->notifyStaff(
                $staffIds,
                'low_stock',
                'item_id',
                $item->id,
                [
                    'title'      => "Stock bajo: {$item->name}",
                    'message'    => "Quedan {$inv->current_stock} unidad(es). {$minLabel}",
                    'payload'    => ['item_id' => $item->id, 'code' => $item->code, 'hotel_id' => $hotelId],
                    'action_url' => '/inventory?tab=consumibles',
                ],
            );
        }

        return $alerted;
    }

    private function lowStockInventories(string $hotelId, mixed $globalThreshold): Collection
    {
        $query = HotelInventory::where('hotel_id', $hotelId)
            ->with('inventoryItem')
            ->whereHas('inventoryItem', fn ($q) => $q->where('active', true));

        if ($globalThreshold !== null) {
            $query->where('current_stock', '<=', (int) $globalThreshold);
        } else {
            $query->whereColumn('current_stock', '<=', 'min_stock_threshold');
        }

        return $query->get();
    }

    private function processExpiringProductAlerts(Collection $staffIds, string $hotelId): int
    {
        $alerted = 0;

        $expiring = InventoryItem::where('active', true)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', Carbon::now()->addDays(7))
            ->whereDate('expiry_date', '>=', today())
            ->get();

        foreach ($expiring as $item) {
            $days = (int) Carbon::today()->diffInDays($item->expiry_date);

            $alerted += $this->notifyStaff(
                $staffIds,
                'expiring_product',
                'item_id',
                $item->id,
                [
                    'title'      => "Próximo a vencer: {$item->name}",
                    'message'    => "Vence en {$days} día(s). Fecha: {$item->expiry_date->format('d/m/Y')}.",
                    'payload'    => ['item_id' => $item->id, 'expiry_date' => $item->expiry_date->toDateString(), 'hotel_id' => $hotelId],
                    'action_url' => '/inventory?tab=consumibles',
                ],
            );
        }

        return $alerted;
    }

    private function processMaintenanceAlerts(Collection $staffIds, string $hotelId): int
    {
        $alerted = 0;

        $maintenances = AssetMaintenance::with('asset')
            ->where('status', 'pending')
            ->whereDate('scheduled_date', '>=', today())
            ->whereDate('scheduled_date', '<=', Carbon::now()->addDays(3))
            ->get();

        foreach ($maintenances as $maint) {
            $days  = (int) Carbon::today()->diffInDays($maint->scheduled_date);
            $label = $days === 0 ? 'HOY' : "en {$days} día(s)";

            $alerted += $this->notifyStaff(
                $staffIds,
                'maintenance_due',
                'maintenance_id',
                $maint->id,
                [
                    'title'      => "Mantenimiento {$label}: {$maint->asset?->name}",
                    'message'    => "Programado para {$maint->scheduled_date->format('d/m/Y')}. {$maint->description}",
                    'payload'    => ['maintenance_id' => $maint->id, 'asset_id' => $maint->asset_id, 'hotel_id' => $hotelId],
                    'action_url' => '/inventory?tab=mantenimientos',
                ],
            );
        }

        return $alerted;
    }

    private function notifyStaff(
        Collection $staffIds,
        string $type,
        string $payloadKey,
        int|string $payloadValue,
        array $data,
    ): int {
        $created = 0;

        foreach ($staffIds as $userId) {
            if ($this->notificationExistsToday($userId, $type, $payloadKey, $payloadValue)) {
                continue;
            }

            Notification::create([
                'type'       => $type,
                'title'      => $data['title'],
                'message'    => $data['message'],
                'payload'    => $data['payload'],
                'action_url' => $data['action_url'],
                'user_id'    => $userId,
            ]);
            $created++;
        }

        return $created;
    }

    private function notificationExistsToday(
        int|string $userId,
        string $type,
        string $payloadKey,
        int|string $payloadValue,
    ): bool {
        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->whereJsonContains("payload->{$payloadKey}", $payloadValue)
            ->whereDate('created_at', today())
            ->exists();
    }
}
