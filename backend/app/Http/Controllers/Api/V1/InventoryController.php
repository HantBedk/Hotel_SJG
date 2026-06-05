<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\MinibarConsumption;
use App\Models\MinibarRestockLog;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\User;
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
            $query->whereRaw('current_stock <= min_stock_threshold');
        }

        if (($minBelow = $request->query('min_stock_below')) !== null && is_numeric($minBelow)) {
            $query->where('current_stock', '<=', (int) $minBelow);
        }

        if ($days = (int) $request->query('expiring_in_days')) {
            $query->whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<=', now()->addDays($days));
        }

        return response()->json(['success' => true, 'data' => $query->paginate($this->perPage($request, 30))]);
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
                    if ($pres) $q2->where('presentation', 'ilike', "%{$pres}%");
                });
            }
        });

        return response()->json([
            'success' => true,
            'data'    => $query->limit(5)->get(['id', 'code', 'name', 'brand', 'presentation', 'current_stock', 'unit']),
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
            $last = InventoryItem::lockForUpdate()->orderByDesc('code')->first();
            $num  = $last ? ((int) ltrim(substr($last->code, 5), '0') ?: 0) + 1 : 1;
            $code = 'PROD-' . str_pad($num, 5, '0', STR_PAD_LEFT);

            $item = InventoryItem::create(array_merge($data, [
                'code'          => $code,
                'unit'          => $data['unit'] ?? 'unidad',
                'current_stock' => $data['current_stock'] ?? 0,
                'min_stock_threshold' => $data['min_stock_threshold'] ?? 5,
            ]));

            // Record initial stock as entry transaction
            if (($item->current_stock ?? 0) > 0) {
                InventoryTransaction::create([
                    'inventory_item_id' => $item->id,
                    'type'              => 'entry',
                    'quantity'          => $item->current_stock,
                    'unit_price'        => $item->cost_price,
                    'total_value'       => $item->cost_price * $item->current_stock,
                    'performed_by'      => $request->user()->id,
                    'notes'             => 'Stock inicial',
                ]);
            }

            return $item;
        });

        return response()->json(['success' => true, 'data' => $item->load('category'), 'message' => 'Producto creado.'], 201);
    }

    public function show(InventoryItem $inventoryItem): JsonResponse
    {
        $inventoryItem->load([
            'category',
            'transactions' => fn($q) => $q->with('performedBy', 'destinationRoom', 'destinationUser')->latest()->limit(20),
        ]);
        return response()->json(['success' => true, 'data' => $inventoryItem]);
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

        $inventoryItem->update($data);
        return response()->json(['success' => true, 'data' => $inventoryItem->load('category'), 'message' => 'Producto actualizado.']);
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

            $inventoryItem->increment('current_stock', $data['quantity']);
        });

        return response()->json(['success' => true, 'data' => $inventoryItem->refresh(), 'message' => 'Stock recargado.']);
    }

    public function adjust(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'new_stock' => 'required|integer|min:0',
            'notes'     => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($inventoryItem, $data, $request) {
            $diff = $data['new_stock'] - $inventoryItem->current_stock;

            InventoryTransaction::create([
                'inventory_item_id' => $inventoryItem->id,
                'type'              => 'adjustment',
                'quantity'          => $diff,
                'unit_price'        => $inventoryItem->cost_price,
                'total_value'       => abs($diff) * $inventoryItem->cost_price,
                'performed_by'      => $request->user()->id,
                'notes'             => $data['notes'] ?? 'Ajuste de inventario',
            ]);

            $inventoryItem->update(['current_stock' => $data['new_stock']]);
        });

        self::checkItemLowStock($inventoryItem->refresh());

        return response()->json(['success' => true, 'data' => $inventoryItem->refresh(), 'message' => 'Stock ajustado.']);
    }

    public function deliver(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $data = $request->validate([
            'quantity'            => 'required|integer|min:1',
            'destination_user_id' => 'required|uuid|exists:users,id',
            'notes'               => 'nullable|string|max:255',
        ]);

        abort_if($inventoryItem->current_stock < $data['quantity'], 409, 'Stock insuficiente.');

        DB::transaction(function () use ($inventoryItem, $data, $request) {
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

            $inventoryItem->decrement('current_stock', $data['quantity']);
        });

        self::checkItemLowStock($inventoryItem->refresh());

        return response()->json(['success' => true, 'data' => $inventoryItem->refresh(), 'message' => 'Entrega registrada.']);
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
        $source   = $request->query('source', 'all');   // all | inventory | minibar
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');
        $perPage  = 60;
        $page     = max(1, (int) $request->query('page', 1));

        $rows = collect();

        // ── Inventory transactions ──────────────────────────────────────────
        if ($source !== 'minibar') {
            InventoryTransaction::with([
                'item:id,name,code,presentation',
                'performedBy:id,name',
                'destinationRoom:id,number',
                'destinationUser:id,name',
            ])
            ->when($search, fn($q) => $q->whereHas('item', fn($q2) =>
                $q2->where('name', 'ilike', "%{$search}%")
                   ->orWhere('code', 'ilike', "%{$search}%")))
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->orderByDesc('created_at')
            ->chunk(500, function ($txs) use (&$rows) {
                $rows = $rows->merge($txs->map(fn($tx) => [
                    'id'               => $tx->id,
                    'source'           => 'inventory',
                    'type'             => $tx->type,
                    'item_name'        => $tx->item?->name ?? '—',
                    'item_code'        => $tx->item?->code,
                    'item_presentation'=> $tx->item?->presentation,
                    'quantity'         => $tx->quantity,
                    'unit_price'       => $tx->unit_price,
                    'total_value'      => $tx->total_value,
                    'performed_by'     => $tx->performedBy?->name,
                    'destination'      => $tx->destinationRoom
                                            ? 'Hab. ' . $tx->destinationRoom->number
                                            : $tx->destinationUser?->name,
                    'notes'            => $tx->notes,
                    'occurred_at'      => $tx->created_at?->toIso8601String(),
                ]));
            });
        }

        // ── Minibar consumptions (ventas estadía) ───────────────────────────
        if ($source !== 'inventory') {
            MinibarConsumption::with([
                'registeredBy:id,name',
                'room:id,number',
                'stay:id',
            ])
            ->when($search, fn($q) => $q->where('product_name', 'ilike', "%{$search}%"))
            ->when($dateFrom, fn($q) => $q->whereDate('registered_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('registered_at', '<=', $dateTo))
            ->orderByDesc('registered_at')
            ->chunk(500, function ($mcs) use (&$rows) {
                $rows = $rows->merge($mcs->map(fn($mc) => [
                    'id'               => $mc->id,
                    'source'           => 'minibar_consumption',
                    'type'             => 'minibar_' . $mc->type,
                    'item_name'        => $mc->product_name,
                    'item_code'        => null,
                    'item_presentation'=> null,
                    'quantity'         => $mc->quantity,
                    'unit_price'       => $mc->unit_price,
                    'total_value'      => $mc->total,
                    'performed_by'     => $mc->registeredBy?->name,
                    'destination'      => $mc->room ? 'Hab. ' . $mc->room->number : null,
                    'notes'            => $mc->stay_id ? "Estadía registrada" : null,
                    'occurred_at'      => $mc->registered_at?->toIso8601String(),
                ]));
            });

            // ── Minibar restocks (reposición de productos a la habitación) ──
            MinibarRestockLog::with([
                'performedBy:id,name',
                'room:id,number',
                'minibarProduct:id,presentation',
            ])
            ->when($search, fn($q) => $q->where('product_name', 'ilike', "%{$search}%"))
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->orderByDesc('created_at')
            ->chunk(500, function ($logs) use (&$rows) {
                $rows = $rows->merge($logs->map(function ($log) {
                    $qty = (int) $log->quantity;
                    // Diferenciamos:
                    //   - room_id NULL  → movimiento en el catálogo (alta inicial o ajuste).
                    //   - room_id !NULL → movimiento contra una habitación (reposición o devolución).
                    if ($log->room_id === null) {
                        $type = $qty >= 0 ? 'minibar_catalog_entry' : 'minibar_catalog_adjustment';
                    } else {
                        $type = $qty >= 0 ? 'minibar_restock' : 'minibar_return';
                    }
                    return [
                        'id'               => $log->id,
                        'source'           => 'minibar',
                        'type'             => $type,
                        'item_name'        => $log->product_name,
                        'item_code'        => null,
                        'item_presentation'=> $log->minibarProduct?->presentation,
                        'quantity'         => $qty,
                        'unit_price'       => $log->unit_price,
                        'total_value'      => $log->total_value,
                        'performed_by'     => $log->performedBy?->name,
                        'destination'      => $log->room ? 'Hab. ' . $log->room->number : 'Catálogo',
                        'notes'            => $log->notes,
                        'occurred_at'      => $log->created_at?->toIso8601String(),
                    ];
                }));
            });
        }

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
        $staffIds = User::permission('manage_inventory')->pluck('id');
        if ($staffIds->isEmpty()) return;

        $lowItems = InventoryItem::where('active', true)
            ->where('current_stock', '<=', $threshold)
            ->get();

        foreach ($lowItems as $item) {
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
                    'message'    => "Quedan {$item->current_stock} unidad(es). Umbral configurado: {$threshold}.",
                    'payload'    => ['item_id' => $item->id, 'code' => $item->code, 'threshold' => $threshold],
                    'action_url' => '/inventory?tab=consumibles',
                    'user_id'    => $userId,
                ]);
            }
        }
    }

    public static function checkItemLowStock(InventoryItem $item): void
    {
        $threshold = Setting::get('inventory.low_stock_threshold', null);
        if ($threshold === null || $item->current_stock > (int) $threshold) return;

        $staffIds = User::permission('manage_inventory')->pluck('id');

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
                'message'    => "Quedan {$item->current_stock} unidad(es). Umbral configurado: {$threshold}.",
                'payload'    => ['item_id' => $item->id, 'code' => $item->code, 'threshold' => (int) $threshold],
                'action_url' => '/inventory?tab=consumibles',
                'user_id'    => $userId,
            ]);
        }
    }
}
