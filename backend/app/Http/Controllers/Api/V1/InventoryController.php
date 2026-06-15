<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\User;
use App\Support\HotelInventoryService;
use App\Support\InventoryHistoryBuilder;
use App\Support\TenantContext;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    use Paginates;

    public function categories(): JsonResponse
    {
        $categories = InventoryCategory::where('active', true)->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function index(Request $request): JsonResponse
    {
        $hotelId = TenantContext::requireId();
        $query = InventoryItem::with('category')
            ->where('active', true)
            ->orderBy('name');

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($search = $request->query('search')) {
            $query->where(fn($q) => $q->where('name', 'ilike', "%{$search}%")
                ->orWhere('code', 'ilike', "%{$search}%")
                ->orWhere('brand', 'ilike', "%{$search}%"));
        }

        if ($request->boolean('low_stock')) {
            $query->whereHas('hotelInventories', fn ($q) => $q
                ->where('hotel_id', $hotelId)
                ->whereColumn('current_stock', '<=', 'min_stock_threshold'));
        }

        if (($minBelow = $request->query('min_stock_below')) !== null && is_numeric($minBelow)) {
            $query->whereHas('hotelInventories', fn ($q) => $q
                ->where('hotel_id', $hotelId)
                ->where('current_stock', '<=', (int) $minBelow));
        }

        if ($days = (int) $request->query('expiring_in_days')) {
            $query->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<=', now()->addDays($days));
        }

        $paginator = $query->paginate($this->perPage($request, 30));
        $paginator->getCollection()->transform(
            fn ($item) => HotelInventoryService::attachStockData($item, $hotelId)
        );

        return response()->json(['success' => true, 'data' => $paginator]);
    }

    public function similar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:150',
            'brand'        => 'nullable|string|max:100',
            'presentation' => 'nullable|string|max:100',
        ]);

        $query = InventoryItem::where('active', true);
        $name = trim($data['name']);
        $brand = trim($data['brand'] ?? '');
        $pres  = trim($data['presentation'] ?? '');

        $query->where(function ($q) use ($name, $brand, $pres) {
            $q->where('name', 'ilike', "%{$name}%");
            if ($brand) {
                $q->orWhere(function ($q2) use ($brand, $pres) {
                    $q2->where('brand', 'ilike', "%{$brand}%");
                    if ($pres) {
                        $q2->where('presentation', 'ilike', "%{$pres}%");
                    }
                });
            }
        });

        return response()->json([
            'success' => true,
            'data'    => $query->limit(5)->get(['id', 'code', 'name', 'brand', 'presentation', 'unit'])
                ->map(fn ($item) => HotelInventoryService::attachStockData($item)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id'         => 'required|uuid|exists:inventory_categories,id',
            'name'                => 'required|string|max:150',
            'brand'               => 'nullable|string|max:100',
            'presentation'        => 'nullable|string|max:100',
            'unit'                => 'nullable|string|max:50',
            'cost_price'          => 'required|numeric|min:0',
            'sale_price'          => 'nullable|numeric|min:0',
            'current_stock'       => 'nullable|integer|min:0',
            'min_stock_threshold' => 'nullable|integer|min:0',
            'expiry_date'         => 'nullable|date',
            'supplier'            => 'nullable|string|max:150',
            'invoice_number'      => 'nullable|string|max:100',
            'location'            => 'nullable|string|max:100',
        ]);

        $item = DB::transaction(function () use ($data, $request) {
            $code = $this->nextProductCode();

            $stock        = (int) ($data['current_stock'] ?? 0);
            $minThreshold = (int) ($data['min_stock_threshold'] ?? 5);
            $location     = $data['location'] ?? null;
            unset($data['current_stock'], $data['min_stock_threshold'], $data['location']);

            $item = InventoryItem::create(array_merge($data, [
                'code' => $code,
                'unit' => $data['unit'] ?? 'unidad',
            ]));

            $hotelInv = HotelInventoryService::forItem($item);
            $hotelInv->update([
                'min_stock_threshold' => $minThreshold,
                'location'            => $location,
            ]);

            if ($stock > 0) {
                InventoryTransaction::create([
                    'inventory_item_id' => $item->id,
                    'type'              => 'entry',
                    'quantity'          => $stock,
                    'unit_price'        => $item->cost_price,
                    'total_value'       => $item->cost_price * $stock,
                    'performed_by'      => $request->user()->id,
                    'notes'             => 'Stock inicial',
                ]);
                $hotelInv->update(['current_stock' => $stock]);
            }

            return HotelInventoryService::attachStockData($item->load('category'));
        });

        return response()->json(['success' => true, 'data' => $item->load('category'), 'message' => 'Producto creado.'], 201);
    }

    public function show(InventoryItem $inventoryItem): JsonResponse
    {
        $inventoryItem->load([
            'category',
            'transactions' => fn($q) => $q->with('performedBy', 'destinationRoom', 'destinationUser')->latest()->limit(20),
        ]);

        return response()->json([
            'success' => true,
            'data'    => HotelInventoryService::attachStockData($inventoryItem),
        ]);
    }

    public function update(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'category_id'         => 'sometimes|uuid|exists:inventory_categories,id',
            'name'                => 'sometimes|string|max:150',
            'brand'               => 'nullable|string|max:100',
            'presentation'        => 'nullable|string|max:100',
            'unit'                => 'nullable|string|max:50',
            'cost_price'          => 'sometimes|numeric|min:0',
            'sale_price'          => 'nullable|numeric|min:0',
            'min_stock_threshold' => 'sometimes|integer|min:0',
            'expiry_date'         => 'nullable|date',
            'supplier'            => 'nullable|string|max:150',
            'invoice_number'      => 'nullable|string|max:100',
            'location'            => 'nullable|string|max:100',
        ]);

        $inventoryItem->update(collect($data)->except(['min_stock_threshold', 'location'])->all());

        if (array_key_exists('min_stock_threshold', $data) || array_key_exists('location', $data)) {
            $hotelInv = HotelInventoryService::forItem($inventoryItem);
            $hotelInv->update(array_filter([
                'min_stock_threshold' => $data['min_stock_threshold'] ?? null,
                'location'            => $data['location'] ?? null,
            ], fn ($v) => $v !== null));
        }

        return response()->json([
            'success' => true,
            'data'    => HotelInventoryService::attachStockData($inventoryItem->load('category')),
            'message' => 'Producto actualizado.',
        ]);
    }

    public function destroy(InventoryItem $inventoryItem): JsonResponse
    {
        $inventoryItem->update(['active' => false]);
        $inventoryItem->delete();
        return response()->json(['success' => true, 'message' => 'Producto eliminado.']);
    }

    public function restock(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'quantity'   => 'required|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($inventoryItem, $data, $request) {
            $hotelInv  = HotelInventoryService::forItem($inventoryItem);
            $unitPrice = $data['unit_price'] ?? $inventoryItem->cost_price;

            InventoryTransaction::create([
                'inventory_item_id' => $inventoryItem->id,
                'type'              => 'entry',
                'quantity'          => $data['quantity'],
                'unit_price'        => $unitPrice,
                'total_value'       => $unitPrice * $data['quantity'],
                'performed_by'      => $request->user()->id,
                'notes'             => $data['notes'] ?? null,
            ]);

            $hotelInv->increment('current_stock', $data['quantity']);
        });

        return response()->json([
            'success' => true,
            'data'    => HotelInventoryService::attachStockData($inventoryItem->refresh()),
            'message' => 'Stock recargado.',
        ]);
    }

    public function adjust(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'new_stock' => 'required|integer|min:0',
            'notes'     => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($inventoryItem, $data, $request) {
            $hotelInv = HotelInventoryService::forItem($inventoryItem);
            $diff     = $data['new_stock'] - $hotelInv->current_stock;

            InventoryTransaction::create([
                'inventory_item_id' => $inventoryItem->id,
                'type'              => 'adjustment',
                'quantity'          => $diff,
                'unit_price'        => $inventoryItem->cost_price,
                'total_value'       => abs($diff) * $inventoryItem->cost_price,
                'performed_by'      => $request->user()->id,
                'notes'             => $data['notes'] ?? 'Ajuste de inventario',
            ]);

            $hotelInv->update(['current_stock' => $data['new_stock']]);
        });

        $refreshed = HotelInventoryService::attachStockData($inventoryItem->refresh());
        self::checkItemLowStock($refreshed);

        return response()->json(['success' => true, 'data' => $refreshed, 'message' => 'Stock ajustado.']);
    }

    public function deliver(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'quantity'            => 'required|integer|min:1',
            'destination_user_id' => 'required|uuid|exists:users,id',
            'notes'               => 'nullable|string|max:255',
        ]);

        $hotelInv = HotelInventoryService::forItem($inventoryItem);
        abort_if($hotelInv->current_stock < $data['quantity'], 409, 'Stock insuficiente.');

        DB::transaction(function () use ($inventoryItem, $data, $request, $hotelInv) {
            InventoryTransaction::create([
                'inventory_item_id'  => $inventoryItem->id,
                'type'               => 'exit_to_housekeeping',
                'quantity'           => -$data['quantity'],
                'unit_price'         => $inventoryItem->cost_price,
                'total_value'        => $inventoryItem->cost_price * $data['quantity'],
                'performed_by'       => $request->user()->id,
                'destination_user_id' => $data['destination_user_id'],
                'notes'              => $data['notes'] ?? null,
            ]);

            $hotelInv->decrement('current_stock', $data['quantity']);
        });

        $refreshed = HotelInventoryService::attachStockData($inventoryItem->refresh());
        self::checkItemLowStock($refreshed);

        return response()->json(['success' => true, 'data' => $refreshed, 'message' => 'Entrega registrada.']);
    }

    public function transactions(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $transactions = $inventoryItem->transactions()
            ->with('performedBy', 'destinationRoom', 'destinationUser')
            ->latest()
            ->paginate($this->perPage($request, 30));

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    public function history(Request $request): JsonResponse
    {
        $search   = $request->query('search');
        $source   = $request->query('source', 'all');
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');
        $perPage  = 60;
        $page     = max(1, (int) $request->query('page', 1));

        $rows = app(InventoryHistoryBuilder::class)->collect($source, $search, $dateFrom, $dateTo);

        $sorted = $rows->sortByDesc('occurred_at')->values();
        $total  = $sorted->count();
        $data   = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $data,
                'meta' => [
                    'total'        => $total,
                    'per_page'     => $perPage,
                    'current_page' => $page,
                    'last_page'    => (int) ceil($total / $perPage),
                ],
            ],
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:consumable,asset,cleaning',
        ]);

        $category = InventoryCategory::create($data);
        return response()->json(['success' => true, 'data' => $category, 'message' => 'Categoría creada.'], 201);
    }

    // ── Low-stock threshold (global) ──────────────────────────────────────────

    public function getLowStockThreshold(): JsonResponse
    {
        $threshold = Setting::get('inventory.low_stock_threshold', null);
        return response()->json(['success' => true, 'data' => ['threshold' => $threshold !== null ? (int) $threshold : null]]);
    }

    public function setLowStockThreshold(Request $request): JsonResponse
    {
        $data = $request->validate([
            'threshold' => 'required|integer|min:1',
        ]);

        Setting::set('inventory.low_stock_threshold', $data['threshold'], 'integer', 'inventory');

        // Disparar alertas inmediatas para los ítems que ya están bajo el umbral
        $this->fireImmediateLowStockAlerts($data['threshold']);

        return response()->json(['success' => true, 'data' => ['threshold' => $data['threshold']], 'message' => 'Umbral guardado.']);
    }

    private function fireImmediateLowStockAlerts(int $threshold): void
    {
        $hotelId  = TenantContext::requireId();
        $staffIds = User::permission('manage_inventory')->pluck('id');
        if ($staffIds->isEmpty()) {
            return;
        }

        $lowItems = \App\Models\HotelInventory::where('hotel_id', $hotelId)
            ->where('current_stock', '<=', $threshold)
            ->with('inventoryItem')
            ->get();

        foreach ($lowItems as $inv) {
            $item = $inv->inventoryItem;
            if (! $item?->active) {
                continue;
            }

            foreach ($staffIds as $userId) {
                $exists = Notification::where('user_id', $userId)
                    ->where('type', 'low_stock')
                    ->whereJsonContains('payload->item_id', $item->id)
                    ->whereDate('created_at', today())
                    ->exists();

                if ($exists) {
                    continue;
                }

                Notification::create([
                    'type'       => 'low_stock',
                    'title'      => "Stock bajo: {$item->name}",
                    'message'    => "Quedan {$inv->current_stock} unidad(es). Umbral configurado: {$threshold}.",
                    'payload'    => ['item_id' => $item->id, 'code' => $item->code, 'threshold' => $threshold, 'hotel_id' => $hotelId],
                    'action_url' => '/inventory?tab=consumibles',
                    'user_id'    => $userId,
                ]);
            }
        }
    }

    public static function checkItemLowStock(InventoryItem $item): void
    {
        $threshold = Setting::get('inventory.low_stock_threshold', null);
        $hotelId   = TenantContext::id();
        if ($threshold === null || ! $hotelId) {
            return;
        }

        $inv = HotelInventoryService::forItem($item, $hotelId);
        if ($inv->current_stock > (int) $threshold) {
            return;
        }

        $staffIds = User::permission('manage_inventory')->pluck('id');

        foreach ($staffIds as $userId) {
            $exists = Notification::where('user_id', $userId)
                ->where('type', 'low_stock')
                ->whereJsonContains('payload->item_id', $item->id)
                ->whereDate('created_at', today())
                ->exists();

            if ($exists) {
                continue;
            }

            Notification::create([
                'type'       => 'low_stock',
                'title'      => "Stock bajo: {$item->name}",
                'message'    => "Quedan {$inv->current_stock} unidad(es). Umbral configurado: {$threshold}.",
                'payload'    => ['item_id' => $item->id, 'code' => $item->code, 'threshold' => (int) $threshold, 'hotel_id' => $hotelId],
                'action_url' => '/inventory?tab=consumibles',
                'user_id'    => $userId,
            ]);
        }
    }

    private function nextProductCode(): string
    {
        $last = InventoryItem::lockForUpdate()->orderByDesc('code')->first();
        $num  = 1;
        if ($last) {
            $num = (int) ltrim(substr($last->code, 5), '0') + 1;
        }

        return 'PROD-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
