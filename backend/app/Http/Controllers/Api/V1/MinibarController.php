<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Minibar;
use App\Models\MinibarProduct;
use App\Models\Room;
use App\Models\RoomMinibar;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MinibarController extends Controller
{
    // ── Products ──────────────────────────────────────────────────────────────

    public function productsIndex(): JsonResponse
    {
        $products = MinibarProduct::with('inventoryItem')->where('active', true)->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $products]);
    }

    public function productsStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'              => 'nullable|string|max:50|unique:minibar_products,code',
            'name'              => 'required|string|max:150',
            'presentation'      => 'nullable|string|max:100',
            'inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'cost_price'        => 'nullable|numeric|min:0',
            'sale_price'        => 'required|numeric|min:0|gt:cost_price',
            'damage_price'      => 'nullable|numeric|min:0',
            'stock_quantity'    => 'nullable|integer|min:0',
            'expiration_date'   => 'nullable|date',
            'description'       => 'nullable|string|max:255',
        ], [
            'sale_price.gt' => 'El precio de venta debe ser mayor al precio de compra.',
        ]);

        $product = MinibarProduct::create($data);
        return response()->json(['success' => true, 'data' => $product, 'message' => 'Producto de minibar creado.'], 201);
    }

    public function productsUpdate(Request $request, MinibarProduct $minibarProduct): JsonResponse
    {
        // Si el request no envía cost_price, validamos contra el valor actual.
        $request->merge([
            'cost_price' => $request->input('cost_price', (string) $minibarProduct->cost_price),
        ]);

        $data = $request->validate([
            'code'              => 'nullable|string|max:50|unique:minibar_products,code,' . $minibarProduct->id,
            'name'              => 'sometimes|string|max:150',
            'presentation'      => 'nullable|string|max:100',
            'inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'cost_price'        => 'nullable|numeric|min:0',
            'sale_price'        => 'sometimes|numeric|min:0|gt:cost_price',
            'damage_price'      => 'nullable|numeric|min:0',
            'stock_quantity'    => 'nullable|integer|min:0',
            'expiration_date'   => 'nullable|date',
            'description'       => 'nullable|string|max:255',
            'active'            => 'sometimes|boolean',
        ], [
            'sale_price.gt' => 'El precio de venta debe ser mayor al precio de compra.',
        ]);

        $minibarProduct->update($data);
        return response()->json(['success' => true, 'data' => $minibarProduct, 'message' => 'Producto actualizado.']);
    }

    public function productsDestroy(MinibarProduct $minibarProduct): JsonResponse
    {
        $minibarProduct->update(['active' => false]);
        return response()->json(['success' => true, 'message' => 'Producto desactivado.']);
    }

    // ── Room minibars ─────────────────────────────────────────────────────────

    public function roomMinibars(Request $request): JsonResponse
    {
        $request->validate(['room_id' => 'required|uuid|exists:rooms,id']);

        $minibars = RoomMinibar::with(['product', 'restockedBy'])
            ->where('room_id', $request->room_id)
            ->get();

        return response()->json(['success' => true, 'data' => $minibars]);
    }

    public function getTemplate(): JsonResponse
    {
        $raw = Setting::get('minibar.default_template', '[]');
        $template = is_string($raw) ? json_decode($raw, true) ?? [] : (array) $raw;

        // Enriquecer con datos del producto
        $productIds = collect($template)->pluck('minibar_product_id')->filter()->values();
        $products = MinibarProduct::whereIn('id', $productIds)->get()->keyBy('id');

        $items = collect($template)->map(function ($row) use ($products) {
            $product = $products->get($row['minibar_product_id'] ?? null);
            return [
                'minibar_product_id' => $row['minibar_product_id'] ?? null,
                'quantity'           => (int) ($row['quantity'] ?? 0),
                'product'            => $product ? [
                    'id'   => $product->id,
                    'name' => $product->name,
                ] : null,
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function saveTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items'                       => 'required|array',
            'items.*.minibar_product_id'  => 'required|uuid|exists:minibar_products,id',
            'items.*.quantity'            => 'required|integer|min:1',
        ]);

        Setting::set('minibar.default_template', json_encode($data['items']), 'json', 'minibar');

        return response()->json(['success' => true, 'message' => 'Plantilla actualizada.']);
    }

    public function applyTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_id' => 'required|uuid|exists:rooms,id',
            'replace' => 'sometimes|boolean',
        ]);

        $raw = Setting::get('minibar.default_template', '[]');
        $template = is_string($raw) ? json_decode($raw, true) ?? [] : (array) $raw;

        if (empty($template)) {
            return response()->json(['success' => false, 'message' => 'No hay plantilla configurada.'], 422);
        }

        DB::transaction(function () use ($template, $data, $request) {
            if (!empty($data['replace'])) {
                RoomMinibar::where('room_id', $data['room_id'])->delete();
            }
            foreach ($template as $row) {
                $productId = $row['minibar_product_id'] ?? null;
                $qty       = (int) ($row['quantity'] ?? 0);
                if (!$productId || $qty <= 0) continue;

                RoomMinibar::updateOrCreate(
                    ['room_id' => $data['room_id'], 'minibar_product_id' => $productId],
                    [
                        'quantity'          => $qty,
                        'last_restocked_at' => now(),
                        'restocked_by'      => $request->user()->id,
                    ]
                );
            }
        });

        return response()->json(['success' => true, 'message' => 'Plantilla aplicada al minibar.']);
    }

    public function restockRoom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_id'            => 'required|uuid|exists:rooms,id',
            'minibar_product_id' => 'required|uuid|exists:minibar_products,id',
            'quantity'           => 'required|integer|min:1',
        ]);

        $product = MinibarProduct::findOrFail($data['minibar_product_id']);

        DB::transaction(function () use ($data, $product, $request) {
            // Update or create room_minibar record
            $rm = RoomMinibar::updateOrCreate(
                ['room_id' => $data['room_id'], 'minibar_product_id' => $data['minibar_product_id']],
                [
                    'quantity'          => DB::raw("quantity + {$data['quantity']}"),
                    'last_restocked_at' => now(),
                    'restocked_by'      => $request->user()->id,
                ]
            );

            // Deduct from inventory item if linked
            if ($product->inventory_item_id) {
                $item = InventoryItem::lockForUpdate()->findOrFail($product->inventory_item_id);
                abort_if($item->current_stock < $data['quantity'], 409, 'Stock de inventario insuficiente.');

                $item->decrement('current_stock', $data['quantity']);

                InventoryTransaction::create([
                    'inventory_item_id'  => $item->id,
                    'type'               => 'exit_to_minibar',
                    'quantity'           => -$data['quantity'],
                    'unit_price'         => $item->cost_price,
                    'total_value'        => $item->cost_price * $data['quantity'],
                    'performed_by'       => $request->user()->id,
                    'destination_room_id' => $data['room_id'],
                    'notes'              => "Reposición minibar hab. " . Room::find($data['room_id'])?->number,
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Minibar repuesto.']);
    }

    // ── Minibars (1 por habitación) ────────────────────────────────────────────

    public function minibarsIndex(): JsonResponse
    {
        $minibars = Minibar::with(['room', 'items.product'])->orderBy('created_at')->get();
        return response()->json(['success' => true, 'data' => $minibars]);
    }

    public function minibarsStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_id' => 'required|uuid|exists:rooms,id|unique:minibars,room_id',
            'name'    => 'nullable|string|max:100',
            'notes'   => 'nullable|string|max:500',
        ], [
            'room_id.unique' => 'Esta habitación ya tiene un minibar asignado.',
        ]);

        $minibar = Minibar::create($data);
        return response()->json([
            'success' => true,
            'data'    => $minibar->load(['room', 'items.product']),
            'message' => 'Minibar creado.',
        ], 201);
    }

    public function minibarsUpdate(Request $request, Minibar $minibar): JsonResponse
    {
        $data = $request->validate([
            'name'   => 'nullable|string|max:100',
            'notes'  => 'nullable|string|max:500',
            'active' => 'sometimes|boolean',
        ]);

        $minibar->update($data);
        return response()->json([
            'success' => true,
            'data'    => $minibar->load(['room', 'items.product']),
            'message' => 'Minibar actualizado.',
        ]);
    }

    public function minibarsDestroy(Minibar $minibar): JsonResponse
    {
        $minibar->delete();
        return response()->json(['success' => true, 'message' => 'Minibar eliminado.']);
    }
}
