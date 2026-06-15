<?php

namespace App\Support;

use App\Models\InventoryTransaction;
use App\Models\MinibarConsumption;
use App\Models\MinibarRestockLog;
use Illuminate\Support\Collection;

class InventoryHistoryBuilder
{
    private const ROOM_LABEL_PREFIX = 'Hab. ';

    public function collect(?string $source, ?string $search, ?string $dateFrom, ?string $dateTo): Collection
    {
        $rows = collect();

        if ($source !== 'minibar') {
            $rows = $rows->merge($this->collectInventoryRows($search, $dateFrom, $dateTo));
        }
        if ($source !== 'inventory') {
            $rows = $rows->merge($this->collectMinibarConsumptionRows($search, $dateFrom, $dateTo));
            $rows = $rows->merge($this->collectMinibarRestockRows($search, $dateFrom, $dateTo));
        }

        return $rows;
    }

    private function collectInventoryRows(?string $search, ?string $dateFrom, ?string $dateTo): Collection
    {
        $rows = collect();

        InventoryTransaction::with([
            'item:id,name,code,presentation',
            'performedBy:id,name',
            'destinationRoom:id,number',
            'destinationUser:id,name',
        ])
            ->when($search, fn ($q) => $q->whereHas('item', fn ($q2) => $q2
                ->where('name', 'ilike', "%{$search}%")
                ->orWhere('code', 'ilike', "%{$search}%")))
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->orderByDesc('created_at')
            ->chunk(500, function ($txs) use (&$rows) {
                $rows = $rows->merge($txs->map(fn ($tx) => $this->mapInventoryRow($tx)));
            });

        return $rows;
    }

    private function mapInventoryRow(InventoryTransaction $tx): array
    {
        return [
            'id'                => $tx->id,
            'source'            => 'inventory',
            'type'              => $tx->type,
            'item_name'         => $tx->item?->name ?? '—',
            'item_code'         => $tx->item?->code,
            'item_presentation' => $tx->item?->presentation,
            'quantity'          => $tx->quantity,
            'unit_price'        => $tx->unit_price,
            'total_value'       => $tx->total_value,
            'performed_by'      => $tx->performedBy?->name,
            'destination'       => $tx->destinationRoom
                ? self::ROOM_LABEL_PREFIX . $tx->destinationRoom->number
                : $tx->destinationUser?->name,
            'notes'             => $tx->notes,
            'occurred_at'       => $tx->created_at?->toIso8601String(),
        ];
    }

    private function collectMinibarConsumptionRows(?string $search, ?string $dateFrom, ?string $dateTo): Collection
    {
        $rows = collect();

        MinibarConsumption::with([
            'registeredBy:id,name',
            'room:id,number',
            'stay:id',
        ])
            ->when($search, fn ($q) => $q->where('product_name', 'ilike', "%{$search}%"))
            ->when($dateFrom, fn ($q) => $q->whereDate('registered_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('registered_at', '<=', $dateTo))
            ->orderByDesc('registered_at')
            ->chunk(500, function ($mcs) use (&$rows) {
                $rows = $rows->merge($mcs->map(fn ($mc) => $this->mapMinibarConsumptionRow($mc)));
            });

        return $rows;
    }

    private function mapMinibarConsumptionRow(MinibarConsumption $mc): array
    {
        return [
            'id'                => $mc->id,
            'source'            => 'minibar_consumption',
            'type'              => 'minibar_' . $mc->type,
            'item_name'         => $mc->product_name,
            'item_code'         => null,
            'item_presentation' => null,
            'quantity'          => $mc->quantity,
            'unit_price'        => $mc->unit_price,
            'total_value'       => $mc->total,
            'performed_by'      => $mc->registeredBy?->name,
            'destination'       => $mc->room ? self::ROOM_LABEL_PREFIX . $mc->room->number : null,
            'notes'             => $mc->stay_id ? 'Estadía registrada' : null,
            'occurred_at'       => $mc->registered_at?->toIso8601String(),
        ];
    }

    private function collectMinibarRestockRows(?string $search, ?string $dateFrom, ?string $dateTo): Collection
    {
        $rows = collect();

        MinibarRestockLog::with([
            'performedBy:id,name',
            'room:id,number',
            'minibarProduct:id,presentation',
        ])
            ->when($search, fn ($q) => $q->where('product_name', 'ilike', "%{$search}%"))
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->orderByDesc('created_at')
            ->chunk(500, function ($logs) use (&$rows) {
                $rows = $rows->merge($logs->map(fn ($log) => $this->mapMinibarRestockRow($log)));
            });

        return $rows;
    }

    private function mapMinibarRestockRow(MinibarRestockLog $log): array
    {
        return [
            'id'                => $log->id,
            'source'            => 'minibar',
            'type'              => $this->minibarRestockType($log),
            'item_name'         => $log->product_name,
            'item_code'         => null,
            'item_presentation' => $log->minibarProduct?->presentation,
            'quantity'          => (int) $log->quantity,
            'unit_price'        => $log->unit_price,
            'total_value'       => $log->total_value,
            'performed_by'      => $log->performedBy?->name,
            'destination'       => $log->room ? self::ROOM_LABEL_PREFIX . $log->room->number : 'Catálogo',
            'notes'             => $log->notes,
            'occurred_at'       => $log->created_at?->toIso8601String(),
        ];
    }

    private function minibarRestockType(MinibarRestockLog $log): string
    {
        $qty = (int) $log->quantity;
        $inCatalog = $log->room_id === null;
        $isPositive = $qty >= 0;

        return match (true) {
            $inCatalog && $isPositive => 'minibar_catalog_entry',
            $inCatalog && !$isPositive => 'minibar_catalog_adjustment',
            !$inCatalog && $isPositive => 'minibar_restock',
            default => 'minibar_return',
        };
    }
}
