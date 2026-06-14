<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\MinibarProduct;
use App\Models\MinibarRestockLog;
use App\Models\MinibarSale;
use App\Models\MinibarSaleItem;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Ventas directas de minibar (no asociadas a un huésped).
 *
 * Flujo seguro: el stock NO se descuenta al crear la venta. Sólo cuando se
 * marca como pagada se descuenta el inventario y se genera la huella en el
 * historial. Si la venta se cancela estando pendiente, no toca stock.
 */
class MinibarSaleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $q = MinibarSale::with(['items.product', 'registeredBy:id,name', 'guest:id,full_name,document_type,document_number,phone', 'cancelledBy:id,name', 'guest:id,full_name,document_type,document_number,phone'])
            ->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }
        if ($from = $request->query('from')) {
            $q->where('created_at', '>=', Carbon::parse($from)->startOfDay());
        }
        if ($to = $request->query('to')) {
            $q->where('created_at', '<=', Carbon::parse($to)->endOfDay());
        }
        if ($search = $request->query('search')) {
            $like = '%' . $search . '%';
            $q->where(function ($w) use ($like) {
                $w->where('sale_number', 'ilike', $like)
                  ->orWhere('customer_name', 'ilike', $like)
                  ->orWhere('customer_document', 'ilike', $like);
            });
        }

        $perPage = (int) $request->query('per_page', 20);
        $sales   = $q->paginate($perPage);

        return $this->success([
            'data' => $sales->items(),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page'    => $sales->lastPage(),
                'per_page'     => $sales->perPage(),
                'total'        => $sales->total(),
            ],
        ]);
    }

    public function show(MinibarSale $minibarSale): JsonResponse
    {
        $minibarSale->load(['items.product', 'registeredBy:id,name', 'guest:id,full_name,document_type,document_number,phone', 'cancelledBy:id,name', 'guest:id,full_name,document_type,document_number,phone']);
        return $this->success($minibarSale);
    }

    /**
     * Crea una venta en estado "pending". No toca stock.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'      => 'nullable|string|max:150',
            'customer_document'  => 'nullable|string|max:50',
            'guest_id'           => 'nullable|uuid|exists:guests,id',
            'notes'              => 'nullable|string|max:500',
            'items'              => 'required|array|min:1',
            'items.*.minibar_product_id' => 'required|uuid|exists:minibar_products,id',
            'items.*.quantity'           => 'required|integer|min:1',
        ]);

        $sale = DB::transaction(function () use ($data, $request) {
            $productIds = collect($data['items'])->pluck('minibar_product_id')->unique();
            $products   = MinibarProduct::with('inventoryItem')
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            $items = [];
            $subtotal = 0.0;
            foreach ($data['items'] as $row) {
                $product = $products->get($row['minibar_product_id']);
                abort_if(!$product || !$product->active, 422, 'Producto no disponible.');

                $unit  = (float) $product->sale_price;
                $qty   = (int)   $row['quantity'];
                $line  = $unit * $qty;
                $items[] = [
                    'minibar_product_id' => $product->id,
                    'product_name'       => $product->name,
                    'product_code'       => $product->code,
                    'quantity'           => $qty,
                    'unit_price'         => $unit,
                    'total'              => $line,
                ];
                $subtotal += $line;
            }

            $sale = MinibarSale::create([
                'sale_number'       => $this->nextSaleNumber(),
                'customer_name'     => $data['customer_name']     ?? null,
                'customer_document' => $data['customer_document'] ?? null,
                'guest_id'          => $data['guest_id']          ?? null,
                'subtotal'          => $subtotal,
                'total'             => $subtotal,
                'status'            => 'pending',
                'notes'             => $data['notes'] ?? null,
                'registered_by'     => $request->user()->id,
            ]);

            foreach ($items as $it) {
                MinibarSaleItem::create(array_merge($it, ['minibar_sale_id' => $sale->id]));
            }

            ActivityLog::record('minibar_sale.created', $request->user()->id, [
                'sale_id'     => $sale->id,
                'sale_number' => $sale->sale_number,
                'total'       => (float) $sale->total,
                'items_count' => count($items),
            ]);

            return $sale;
        });

        return $this->success(
            $sale->load(['items.product', 'registeredBy:id,name', 'guest:id,full_name,document_type,document_number,phone']),
            'Venta registrada (pendiente de pago).',
            201,
        );
    }

    /**
     * Confirma el pago y RECIÉN AQUÍ descuenta stock. Si algo falla por stock,
     * la transacción se revierte y la venta sigue en pending.
     */
    public function pay(Request $request, MinibarSale $minibarSale): JsonResponse
    {
        $data = $request->validate([
            'payment_method' => 'required|in:cash,transfer,card,credit',
            'guest_id'       => 'nullable|uuid|exists:guests,id',
        ]);

        abort_if($minibarSale->status !== 'pending', 422, 'Esta venta no está pendiente.');

        // Crédito exige un huésped (de la BD) al que cargarle el saldo.
        if ($data['payment_method'] === 'credit') {
            $guestId = $data['guest_id'] ?? $minibarSale->guest_id;
            abort_if(! $guestId, 422, 'Para pago a crédito se requiere seleccionar un huésped.');
            if ($data['guest_id'] ?? null) {
                $minibarSale->guest_id = $data['guest_id'];
            }
        }

        DB::transaction(function () use ($minibarSale, $data, $request) {
            $minibarSale->load('items');

            foreach ($minibarSale->items as $item) {
                $product = MinibarProduct::lockForUpdate()->findOrFail($item->minibar_product_id);

                if ($product->inventory_item_id) {
                    $stockItem = InventoryItem::lockForUpdate()
                        ->findOrFail($product->inventory_item_id);

                    abort_if(
                        $stockItem->current_stock < $item->quantity,
                        409,
                        'Stock insuficiente para "' . $product->name . '" (' . $stockItem->current_stock . ' disponibles).',
                    );

                    $stockItem->decrement('current_stock', $item->quantity);

                    InventoryTransaction::create([
                        'inventory_item_id' => $stockItem->id,
                        'type'              => 'sale',
                        'quantity'          => -$item->quantity,
                        'unit_price'        => $item->unit_price,
                        'total_value'       => $item->total,
                        'performed_by'      => $request->user()->id,
                        'notes'             => 'Venta directa minibar ' . $minibarSale->sale_number,
                    ]);
                } else {
                    abort_if(
                        $product->stock_quantity < $item->quantity,
                        409,
                        'Stock insuficiente para "' . $product->name . '" (' . $product->stock_quantity . ' disponibles en bodega).',
                    );
                    $product->decrement('stock_quantity', $item->quantity);
                }

                // Huella en el historial del minibar (salida directa = quantity negativo).
                MinibarRestockLog::create([
                    'room_id'            => null,
                    'minibar_product_id' => $product->id,
                    'product_name'       => $product->name,
                    'quantity'           => -$item->quantity,
                    'unit_price'         => (float) $item->unit_price,
                    'total_value'        => (float) $item->total,
                    'performed_by'       => $request->user()->id,
                    'notes'              => 'Venta directa minibar ' . $minibarSale->sale_number,
                ]);
            }

            $minibarSale->update([
                'status'         => 'paid',
                'payment_method' => $data['payment_method'],
                'paid_at'        => now(),
            ]);

            ActivityLog::record('minibar_sale.paid', $request->user()->id, [
                'sale_id'        => $minibarSale->id,
                'sale_number'    => $minibarSale->sale_number,
                'total'          => (float) $minibarSale->total,
                'payment_method' => $data['payment_method'],
            ]);
        });

        return $this->success(
            $minibarSale->fresh()->load(['items.product', 'registeredBy:id,name', 'guest:id,full_name,document_type,document_number,phone']),
            'Venta pagada.',
        );
    }

    /**
     * Cancela una venta. Si estaba pagada, restituye el stock.
     */
    public function cancel(Request $request, MinibarSale $minibarSale): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        abort_if($minibarSale->status === 'cancelled', 422, 'La venta ya está cancelada.');

        DB::transaction(function () use ($minibarSale, $data, $request) {
            $wasPaid = $minibarSale->status === 'paid';

            if ($wasPaid) {
                $minibarSale->load('items');
                foreach ($minibarSale->items as $item) {
                    $product = MinibarProduct::lockForUpdate()->findOrFail($item->minibar_product_id);

                    if ($product->inventory_item_id) {
                        $stockItem = InventoryItem::lockForUpdate()
                            ->findOrFail($product->inventory_item_id);
                        $stockItem->increment('current_stock', $item->quantity);

                        InventoryTransaction::create([
                            'inventory_item_id' => $stockItem->id,
                            'type'              => 'adjustment',
                            'quantity'          => $item->quantity,
                            'unit_price'        => $item->unit_price,
                            'total_value'       => $item->total,
                            'performed_by'      => $request->user()->id,
                            'notes'             => 'Anulación venta directa ' . $minibarSale->sale_number,
                        ]);
                    } else {
                        $product->increment('stock_quantity', $item->quantity);
                    }

                    MinibarRestockLog::create([
                        'room_id'            => null,
                        'minibar_product_id' => $product->id,
                        'product_name'       => $product->name,
                        'quantity'           => $item->quantity,
                        'unit_price'         => (float) $item->unit_price,
                        'total_value'        => (float) $item->total,
                        'performed_by'       => $request->user()->id,
                        'notes'              => 'Reversión venta directa ' . $minibarSale->sale_number,
                    ]);
                }
            }

            $minibarSale->update([
                'status'              => 'cancelled',
                'cancelled_at'        => now(),
                'cancelled_by_id'     => $request->user()->id,
                'cancellation_reason' => $data['reason'] ?? null,
            ]);

            ActivityLog::record('minibar_sale.cancelled', $request->user()->id, [
                'sale_id'     => $minibarSale->id,
                'sale_number' => $minibarSale->sale_number,
                'was_paid'    => $wasPaid,
                'reason'      => $data['reason'] ?? null,
            ]);
        });

        return $this->success(
            $minibarSale->fresh()->load(['items.product', 'registeredBy:id,name', 'guest:id,full_name,document_type,document_number,phone', 'cancelledBy:id,name', 'guest:id,full_name,document_type,document_number,phone']),
            'Venta cancelada.',
        );
    }

    /**
     * Borra físicamente una venta pendiente (no pagada ni cancelada).
     * Útil si el usuario simplemente quiere descartar antes de cobrar.
     */
    public function destroy(MinibarSale $minibarSale): JsonResponse
    {
        abort_if($minibarSale->status !== 'pending', 422, 'Sólo se pueden eliminar ventas pendientes.');
        $minibarSale->delete();
        return $this->success(null, 'Venta descartada.');
    }

    private function nextSaleNumber(): string
    {
        $prefix = 'VM-' . now()->format('Ymd') . '-';
        $last   = MinibarSale::where('sale_number', 'like', $prefix . '%')
            ->orderByDesc('sale_number')
            ->value('sale_number');
        $next = 1;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $next = (int) $m[1] + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
