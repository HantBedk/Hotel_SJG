<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
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

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:consumable,asset,cleaning',
        ]);

        $category = InventoryCategory::create($data);
        return response()->json(['success' => true, 'data' => $category, 'message' => 'Categoría creada.'], 201);
    }
}
