<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\NewCheckIn;
use App\Events\RoomStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ExtraService;
use App\Models\Hotel;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\MinibarConsumption;
use App\Models\MinibarProduct;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomMinibar;
use App\Models\Setting;
use App\Models\Stay;
use App\Models\StayGuest;
use App\Models\StayRoom;
use App\Models\User;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StayController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $query = Stay::with(['guest', 'company', 'stayRooms.room.roomType'])
            ->orderByDesc('check_in_datetime');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        $stays = $query->paginate($this->perPage($request, 20));

        return response()->json(['success' => true, 'data' => $stays]);
    }

    public function show(Stay $stay): JsonResponse
    {
        $stay->load([
            'guest.companions',
            'company',
            'stayRooms.room.roomType',
            'stayGuests.guest',
            'payments.receptionist',
            'transfers',
            'services.extraService',
            'minibarConsumptions',
            'createdBy',
        ]);

        return response()->json(['success' => true, 'data' => $stay]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_id'               => 'required|uuid|exists:guests,id',
            'company_id'             => 'nullable|uuid|exists:companies,id',
            'room_ids'               => 'required|array|min:1',
            'room_ids.*'             => 'uuid|exists:rooms,id',
            'check_in_datetime'      => 'required|date',
            'check_out_datetime'     => 'required|date|after:check_in_datetime',
            'prices'                 => 'required|array',
            'prices.*'               => 'numeric|min:0',
            'notes'                  => 'nullable|string',
            'additional_guest_ids'   => 'nullable|array',
            'additional_guest_ids.*' => 'uuid|exists:guests,id|distinct',
        ]);

        $checkIn  = Carbon::parse($data['check_in_datetime']);
        $checkOut = Carbon::parse($data['check_out_datetime']);
        $nights   = max(1, (int) $checkIn->diffInDays($checkOut));

        $stay = DB::transaction(function () use ($data, $checkIn, $checkOut, $nights, $request) {
            $rooms = Room::whereIn('id', $data['room_ids'])
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($data['room_ids'] as $roomId) {
                $room = $rooms->get($roomId);
                abort_if(!$room, 404, "Habitación no encontrada: {$roomId}");
                abort_if(
                    !in_array($room->status, ['available', 'reserved']),
                    409,
                    "La habitación {$room->number} no está disponible (estado: {$room->status})."
                );
            }

            $totalAmount = collect($data['room_ids'])->sum(function ($roomId) use ($data, $nights) {
                return ($data['prices'][$roomId] ?? 0) * $nights;
            });

            $stay = Stay::create([
                'guest_id'           => $data['guest_id'],
                'company_id'         => $data['company_id'] ?? null,
                'status'             => 'active',
                'check_in_datetime'  => $checkIn,
                'check_out_datetime' => $checkOut,
                'total_amount'       => $totalAmount,
                'paid_amount'        => 0,
                'created_by'         => $request->user()->id,
                'notes'              => $data['notes'] ?? null,
            ]);

            foreach ($data['room_ids'] as $roomId) {
                $room          = $rooms->get($roomId);
                $pricePerNight = $data['prices'][$roomId] ?? $room->roomType->base_price;

                StayRoom::create([
                    'stay_id'         => $stay->id,
                    'room_id'         => $roomId,
                    'check_in_date'   => $checkIn->toDateString(),
                    'check_out_date'  => $checkOut->toDateString(),
                    'price_per_night' => $pricePerNight,
                    'nights'          => $nights,
                    'subtotal'        => $pricePerNight * $nights,
                    'is_active'       => true,
                ]);

                $room->update(['status' => 'occupied']);
                broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
            }

            $stay->stayGuests()->create(['guest_id' => $data['guest_id'], 'is_primary' => true]);
            foreach ($data['additional_guest_ids'] ?? [] as $guestId) {
                if ($guestId !== $data['guest_id']) {
                    $stay->stayGuests()->create(['guest_id' => $guestId, 'is_primary' => false]);
                }
            }

            broadcast(new NewCheckIn($stay->load('guest', 'stayRooms')))->toOthers();

            return $stay;
        });

        $stay->load(['guest', 'company', 'stayRooms.room.roomType', 'stayGuests.guest', 'createdBy']);

        ActivityLog::record('stay.checkin', $request->user()->id, [
            'stay_id'      => $stay->id,
            'guest_name'   => $stay->guest?->full_name,
            'rooms'        => $stay->stayRooms->pluck('room.number')->filter()->values(),
            'total_amount' => (float) $stay->total_amount,
        ]);

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Check-in realizado.'], 201);
    }

    public function checkout(Request $request, Stay $stay): JsonResponse
    {
        abort_if($stay->status === 'checked_out', 409, 'Esta estadía ya fue cerrada.');

        $data = $request->validate([
            'actual_check_out_datetime' => 'nullable|date',
            'late_checkout_fee'         => 'nullable|numeric|min:0',
            'notes'                     => 'nullable|string',
        ]);

        $checkoutAt = Carbon::parse($data['actual_check_out_datetime'] ?? now());
        $cleaningRooms = collect();

        DB::transaction(function () use ($stay, $checkoutAt, $data, $cleaningRooms) {
            $roomsTotal    = $stay->stayRooms()->where('is_active', true)->sum('subtotal');
            $servicesTotal = $stay->services()->sum('total');
            $minibarTotal  = $stay->minibarConsumptions()->sum('total');
            $lateFee       = (float) ($data['late_checkout_fee'] ?? 0);
            $subtotal      = (float) $roomsTotal + (float) $servicesTotal + (float) $minibarTotal + $lateFee;

            $ivaEnabled = Setting::get('hotel.iva_enabled', false);
            $ivaPct     = $ivaEnabled ? (float) Setting::get('hotel.iva_rate', 19) : 0;
            $ivaAmount  = $ivaEnabled ? round($subtotal * ($ivaPct / 100), 2) : 0;
            $total      = $subtotal + $ivaAmount;

            $stay->update([
                'status'                    => 'checked_out',
                'actual_check_out_datetime' => $checkoutAt,
                'late_checkout_fee'         => $lateFee ?: null,
                'total_amount'              => $total,
                'notes'                     => $data['notes'] ?? $stay->notes,
            ]);

            foreach ($stay->activeStayRooms as $stayRoom) {
                $stayRoom->room->update(['status' => 'cleaning']);
                broadcast(new RoomStatusChanged($stayRoom->room->refresh()))->toOthers();
                $cleaningRooms->push($stayRoom->room);
            }

            // El stock del minibar / catálogo ya se descontó al registrar cada
            // consumo (ver minibarCharges()). Aquí no volvemos a descontar para
            // evitar contar dos veces el mismo movimiento.
        });

        ActivityLog::record('stay.checkout', $request->user()->id, [
            'stay_id'    => $stay->id,
            'guest_name' => $stay->guest?->full_name,
            'total'      => (float) $stay->refresh()->total_amount,
        ]);

        foreach ($cleaningRooms as $room) {
            ActivityLog::record('room.cleaning', $request->user()->id, [
                'room_id'     => $room->id,
                'room_number' => $room->number,
                'old_status'  => 'occupied',
                'new_status'  => 'cleaning',
                'reason'      => 'checkout',
            ]);
        }

        return response()->json(['success' => true, 'data' => $stay->refresh(), 'message' => 'Checkout realizado.']);
    }

    public function account(Stay $stay): JsonResponse
    {
        $stay->load(['stayRooms.room.roomType', 'services.extraService', 'minibarConsumptions']);

        $roomLines = $stay->stayRooms->map(fn($sr) => [
            'room_number'     => $sr->room->number ?? '—',
            'room_type'       => $sr->room->roomType->name ?? '—',
            'price_per_night' => (float) $sr->price_per_night,
            'nights'          => $sr->nights,
            'subtotal'        => (float) $sr->subtotal,
            'is_active'       => $sr->is_active,
        ]);

        $serviceLines = $stay->services->map(fn($s) => [
            'name'       => $s->extraService->name ?? 'Servicio',
            'quantity'   => $s->quantity,
            'unit_price' => (float) $s->unit_price,
            'total'      => (float) $s->total,
        ]);

        $minibarLines = $stay->minibarConsumptions->map(fn($m) => [
            'product_name' => $m->product_name,
            'type'         => $m->type,
            'quantity'     => $m->quantity,
            'unit_price'   => (float) $m->unit_price,
            'total'        => (float) $m->total,
        ]);

        $roomsTotal    = $roomLines->where('is_active', true)->sum('subtotal');
        $servicesTotal = $serviceLines->sum('total');
        $minibarTotal  = $minibarLines->sum('total');
        $lateFee       = (float) ($stay->late_checkout_fee ?? 0);
        $subtotal      = $roomsTotal + $servicesTotal + $minibarTotal + $lateFee;

        $ivaEnabled = Setting::get('hotel.iva_enabled', false);
        $ivaPct     = $ivaEnabled ? (float) Setting::get('hotel.iva_rate', 19) : 0;
        $ivaAmount  = $ivaEnabled ? round($subtotal * ($ivaPct / 100), 2) : 0;
        $total      = $subtotal + $ivaAmount;

        return response()->json([
            'success' => true,
            'data' => [
                'rooms'             => $roomLines->values(),
                'services'          => $serviceLines->values(),
                'minibar'           => $minibarLines->values(),
                'late_checkout_fee' => $lateFee,
                'subtotal'          => $subtotal,
                'iva_pct'           => $ivaPct,
                'iva_amount'        => $ivaAmount,
                'total'             => $total,
                'paid_amount'       => (float) $stay->paid_amount,
                'balance'           => max(0, $total - (float) $stay->paid_amount),
            ],
        ]);
    }

    public function extend(Request $request, Stay $stay): JsonResponse
    {
        abort_if(!in_array($stay->status, ['active', 'extended']), 409, 'Solo se puede extender una estadía activa.');

        $data = $request->validate([
            'check_out_datetime' => 'required|date|after:' . $stay->check_in_datetime,
        ]);

        $newCheckOut = Carbon::parse($data['check_out_datetime']);
        $checkIn     = Carbon::parse($stay->check_in_datetime);
        $newNights   = max(1, (int) $checkIn->diffInDays($newCheckOut));

        DB::transaction(function () use ($stay, $newCheckOut, $newNights) {
            foreach ($stay->activeStayRooms as $sr) {
                $sr->update([
                    'check_out_date' => $newCheckOut->toDateString(),
                    'nights'         => $newNights,
                    'subtotal'       => $sr->price_per_night * $newNights,
                ]);
            }

            $roomsTotal    = $stay->stayRooms()->where('is_active', true)->sum('subtotal');
            $servicesTotal = $stay->services()->sum('total');
            $minibarTotal  = $stay->minibarConsumptions()->sum('total');

            $stay->update([
                'status'             => 'extended',
                'check_out_datetime' => $newCheckOut,
                'total_amount'       => (float) $roomsTotal + (float) $servicesTotal + (float) $minibarTotal,
            ]);
        });

        $stay->refresh();

        ActivityLog::record('stay.extended', $request->user()->id, [
            'stay_id'             => $stay->id,
            'guest_name'          => $stay->guest?->full_name,
            'new_check_out'       => $newCheckOut->toDateTimeString(),
            'new_nights'          => $newNights,
        ]);

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Estadía extendida.']);
    }

    public function addRoom(Request $request, Stay $stay): JsonResponse
    {
        abort_if(!in_array($stay->status, ['active', 'extended']), 409, 'Solo se puede agregar habitaciones a una estadía activa.');

        $data = $request->validate([
            'room_id'         => 'required|uuid|exists:rooms,id',
            'price_per_night' => 'required|numeric|min:0',
        ]);

        $checkIn  = Carbon::parse($stay->check_in_datetime);
        $checkOut = Carbon::parse($stay->check_out_datetime);
        $nights   = max(1, (int) $checkIn->diffInDays($checkOut));
        $subtotal = $data['price_per_night'] * $nights;

        DB::transaction(function () use ($stay, $data, $checkIn, $checkOut, $nights, $subtotal) {
            $room = Room::lockForUpdate()->findOrFail($data['room_id']);
            abort_if(
                !in_array($room->status, ['available', 'reserved']),
                409,
                "La habitación {$room->number} no está disponible."
            );

            StayRoom::create([
                'stay_id'         => $stay->id,
                'room_id'         => $room->id,
                'check_in_date'   => $checkIn->toDateString(),
                'check_out_date'  => $checkOut->toDateString(),
                'price_per_night' => $data['price_per_night'],
                'nights'          => $nights,
                'subtotal'        => $subtotal,
                'is_active'       => true,
            ]);

            $room->update(['status' => 'occupied']);
            broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
            $stay->increment('total_amount', $subtotal);
        });

        $stay->load('stayRooms.room.roomType');

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Habitación agregada.'], 201);
    }

    public function minibarCharges(Request $request, Stay $stay): JsonResponse
    {
        abort_if($stay->status === 'checked_out', 409, 'La estadía ya está cerrada.');

        // unit_price NO se acepta del cliente: lo resolvemos desde el producto en
        // la BD para que no pueda manipularse. consumed/missing → sale_price,
        // damaged → damage_price (con fallback a sale_price si no está fijado).
        $data = $request->validate([
            'items'                => 'required|array|min:1',
            'items.*.product_name' => 'required|string|max:100',
            'items.*.room_id'      => 'required|uuid|exists:rooms,id',
            'items.*.type'         => 'required|in:consumed,damaged,missing',
            'items.*.quantity'     => 'required|integer|min:1',
        ]);

        $records = DB::transaction(function () use ($stay, $data, $request) {
            $records    = [];
            $batchTotal = 0;
            foreach ($data['items'] as $item) {
                $product = MinibarProduct::where('name', $item['product_name'])->first();
                abort_if(! $product, 422, "Producto de minibar no encontrado: {$item['product_name']}");

                $unitPrice = $item['type'] === 'damaged'
                    ? (float) ($product->damage_price ?? $product->sale_price)
                    : (float) $product->sale_price;

                $itemTotal   = $unitPrice * $item['quantity'];
                $batchTotal += $itemTotal;
                $consumption = $stay->minibarConsumptions()->create([
                    'room_id'       => $item['room_id'],
                    'product_name'  => $item['product_name'],
                    'quantity'      => $item['quantity'],
                    'type'          => $item['type'],
                    'unit_price'    => $unitPrice,
                    'total'         => $itemTotal,
                    'registered_at' => now(),
                    'registered_by' => $request->user()->id,
                ]);

                // Descontar stock al momento del registro (no en checkout):
                //   1. RoomMinibar de la habitación si existe stock.
                //   2. El resto sale del catálogo (MinibarProduct.stock_quantity
                //      o InventoryItem.current_stock si el producto está vinculado).
                $this->deductMinibarStock($product, $consumption, $request->user()->id);

                $records[] = $consumption;
            }
            $stay->increment('total_amount', $batchTotal);
            return $records;
        });

        return response()->json(['success' => true, 'data' => $records, 'message' => 'Consumos registrados.'], 201);
    }

    /**
     * Descuenta el stock asociado a un consumo de minibar.
     * Primero del RoomMinibar (lo que estaba físicamente en la habitación) y
     * el resto del catálogo o InventoryItem vinculado.
     */
    private function deductMinibarStock(MinibarProduct $product, MinibarConsumption $consumption, string $userId): void
    {
        $qty = (int) $consumption->quantity;
        if ($qty <= 0) return;

        $rm = RoomMinibar::lockForUpdate()
            ->where('room_id', $consumption->room_id)
            ->where('minibar_product_id', $product->id)
            ->first();

        $fromRoom = $rm ? min($qty, (int) $rm->quantity) : 0;
        if ($fromRoom > 0) {
            $rm->decrement('quantity', $fromRoom);
        }

        $fromCatalog = $qty - $fromRoom;
        if ($fromCatalog > 0) {
            if ($product->inventory_item_id) {
                $item = InventoryItem::lockForUpdate()->find($product->inventory_item_id);
                if ($item) {
                    $item->decrement('current_stock', $fromCatalog);
                    InventoryTransaction::create([
                        'inventory_item_id' => $item->id,
                        'type'              => 'sale',
                        'quantity'          => $fromCatalog,
                        'unit_price'        => $consumption->unit_price,
                        'total_value'       => (float) $consumption->unit_price * $fromCatalog,
                        'performed_by'      => $userId,
                        'notes'             => "Consumo minibar registrado (estadía #{$consumption->stay_id})",
                    ]);
                }
            } else {
                $fresh = MinibarProduct::lockForUpdate()->find($product->id);
                if ($fresh) {
                    $fresh->decrement('stock_quantity', $fromCatalog);
                }
            }
        }
    }

    /**
     * Devuelve el stock de un consumo cancelado, simétricamente a deductMinibarStock.
     */
    private function restoreMinibarStock(MinibarConsumption $consumption, string $userId): void
    {
        $qty = (int) $consumption->quantity;
        if ($qty <= 0) return;

        $product = MinibarProduct::where('name', $consumption->product_name)->first();
        if (! $product) return;

        // Reponemos al RoomMinibar si existe entrada (ahí se descontó primero).
        $rm = RoomMinibar::lockForUpdate()
            ->where('room_id', $consumption->room_id)
            ->where('minibar_product_id', $product->id)
            ->first();

        if ($rm) {
            $rm->increment('quantity', $qty);
        } else {
            if ($product->inventory_item_id) {
                $item = InventoryItem::lockForUpdate()->find($product->inventory_item_id);
                if ($item) {
                    $item->increment('current_stock', $qty);
                    InventoryTransaction::create([
                        'inventory_item_id' => $item->id,
                        'type'              => 'adjustment',
                        'quantity'          => $qty,
                        'unit_price'        => $consumption->unit_price,
                        'total_value'       => (float) $consumption->unit_price * $qty,
                        'performed_by'      => $userId,
                        'notes'             => "Reverso de consumo minibar anulado (estadía #{$consumption->stay_id})",
                    ]);
                }
            } else {
                $fresh = MinibarProduct::lockForUpdate()->find($product->id);
                if ($fresh) {
                    $fresh->increment('stock_quantity', $qty);
                }
            }
        }
    }

    /**
     * Anula un consumo de minibar registrado durante la estadía.
     * - Solo aplica si la estadía aún está activa/extendida (no checked_out).
     * - Resta el total del consumo del total_amount de la estadía.
     * - Borra el registro (la "devolución" lógica al catálogo/minibar de habitación es
     *   automática: como solo descontamos stock al hacer checkout, no hay nada que
     *   restaurar mientras la estadía siga abierta).
     * - Queda registro en ActivityLog y se notifica a los administradores.
     */
    public function cancelMinibarConsumption(Request $request, Stay $stay, MinibarConsumption $consumption): JsonResponse
    {
        abort_if($consumption->stay_id !== $stay->id, 404, 'Consumo no encontrado en esta estadía.');
        abort_if($stay->status === 'checked_out', 409, 'La estadía ya está cerrada; no se puede anular el consumo.');

        $data = $request->validate([
            'reason' => 'required|string|min:5|max:500',
        ]);

        $user        = $request->user();
        $amount      = (float) $consumption->total;
        $productName = $consumption->product_name;
        $quantity    = (int)   $consumption->quantity;
        $roomId      = $consumption->room_id;

        DB::transaction(function () use ($stay, $consumption, $amount, $user) {
            // Devolver el stock al lugar de origen antes de borrar el registro.
            $this->restoreMinibarStock($consumption, $user->id);
            $stay->decrement('total_amount', $amount);
            $consumption->delete();
        });

        ActivityLog::record('stay.minibar_cancelled', $user->id, [
            'stay_id'      => $stay->id,
            'room_id'      => $roomId,
            'product_name' => $productName,
            'quantity'     => $quantity,
            'amount'       => $amount,
            'reason'       => $data['reason'],
        ]);

        $this->notifyAdminsOfCancellation(
            title:   'Consumo de minibar anulado',
            message: sprintf(
                '%s anuló un consumo de minibar (%s × %d, %s) en la estadía de %s. Motivo: %s',
                $user->name,
                $productName,
                $quantity,
                '$' . number_format($amount, 0, ',', '.'),
                optional($stay->guest)->full_name ?? 'huésped',
                $data['reason'],
            ),
            payload: [
                'stay_id'      => $stay->id,
                'room_id'      => $roomId,
                'product_name' => $productName,
                'quantity'     => $quantity,
                'amount'       => $amount,
                'reason'       => $data['reason'],
                'by_user_id'   => $user->id,
                'by_name'      => $user->name,
            ],
            actionUrl:    '/activity?tab=movimientos',
            excludeUserId: $user->id,
            type:         'minibar_cancelled',
        );

        return response()->json([
            'success' => true,
            'message' => 'Consumo anulado. Queda registrado en el historial.',
        ]);
    }

    public function receipt(Request $request, Stay $stay): mixed
    {
        abort_if($stay->status !== 'checked_out', 422, 'El comprobante solo está disponible para estadías cerradas.');

        $stay->load(['guest', 'company', 'stayRooms.room.roomType', 'services.extraService', 'minibarConsumptions', 'payments']);

        if (!$stay->receipt_number) {
            $yearMonth = now()->format('Ym');
            $seqKey    = "receipt_seq_{$yearMonth}";

            DB::transaction(function () use ($seqKey, $stay, $yearMonth) {
                $current    = (int) Setting::get($seqKey, 0);
                $next       = $current + 1;
                Setting::set($seqKey, $next, 'integer', 'receipts');
                $compNumber = 'COMP-' . substr($yearMonth, 0, 4) . substr($yearMonth, 4, 2) . '-' . str_pad($next, 4, '0', STR_PAD_LEFT);
                $stay->update(['receipt_number' => $compNumber]);
            });
            $stay->refresh();
        }

        // R31: checkboxes de gastos — permitir excluir secciones
        $include = [
            'rooms'    => $request->boolean('include_rooms',   true),
            'services' => $request->boolean('include_services', true),
            'minibar'  => $request->boolean('include_minibar',  true),
            'late_fee' => $request->boolean('include_late_fee', true),
        ];

        $compNumber   = $stay->receipt_number;
        $roomLines    = $include['rooms']    ? $stay->stayRooms           : collect();
        $serviceLines = $include['services'] ? $stay->services            : collect();
        $minibarLines = $include['minibar']  ? $stay->minibarConsumptions : collect();

        $roomsTotal    = (float) $roomLines->sum('subtotal');
        $servicesTotal = (float) $serviceLines->sum('total');
        $minibarTotal  = (float) $minibarLines->sum('total');
        $lateFee       = $include['late_fee'] ? (float) ($stay->late_checkout_fee ?? 0) : 0;
        $subtotal      = $roomsTotal + $servicesTotal + $minibarTotal + $lateFee;

        $ivaEnabled = Setting::get('hotel.iva_enabled', false);
        $ivaPct     = $ivaEnabled ? (float) Setting::get('hotel.iva_rate', 19) : 0;
        $ivaAmount  = $ivaEnabled ? round($subtotal * ($ivaPct / 100), 2) : 0;
        $total      = $subtotal + $ivaAmount;

        $hotel      = Hotel::first();
        $hotelName  = $hotel?->name  ?? Setting::get('hotel_name', 'Hotel');
        $hotelPhone = $hotel?->phone ?? Setting::get('hotel_phone', '');
        $hotelAddr  = $hotel?->address ?? Setting::get('hotel_address', '');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', compact(
            'stay', 'compNumber', 'roomLines', 'serviceLines', 'minibarLines',
            'roomsTotal', 'servicesTotal', 'minibarTotal', 'lateFee',
            'subtotal', 'ivaPct', 'ivaAmount', 'total',
            'hotelName', 'hotelPhone', 'hotelAddr', 'include'
        ));

        // Guardar copia en storage/app/comprobantes/{YYYY-MM}/COMP-XXXX.pdf
        try {
            $relativePath = "comprobantes/" . now()->format('Y-m') . "/{$compNumber}.pdf";
            \Illuminate\Support\Facades\Storage::disk('local')->put($relativePath, $pdf->output());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('No se pudo guardar copia del comprobante', ['stay_id' => $stay->id, 'error' => $e->getMessage()]);
        }

        return $pdf->stream("comprobante-{$compNumber}.pdf");
    }

    public function checkInReceipt(Stay $stay): mixed
    {
        $stay->load([
            'guest', 'company',
            'stayRooms.room.roomType',
            'stayGuests.guest',
        ]);

        $hotel      = Hotel::first();
        $hotelName  = $hotel?->name  ?? Setting::get('hotel_name', 'Hotel');
        $hotelPhone = $hotel?->phone ?? Setting::get('hotel_phone', '');
        $hotelAddr  = $hotel?->address ?? Setting::get('hotel_address', '');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.checkin', compact(
            'stay', 'hotelName', 'hotelPhone', 'hotelAddr'
        ));

        return $pdf->stream("checkin-{$stay->id}.pdf");
    }

    public function transfer(Request $request, Stay $stay): JsonResponse
    {
        abort_if($stay->status !== 'active', 409, 'Solo se puede transferir una estadía activa.');

        $data = $request->validate([
            'from_room_id' => 'required|uuid|exists:rooms,id',
            'to_room_id'   => 'required|uuid|exists:rooms,id|different:from_room_id',
            'reason'       => 'nullable|string',
            'notes'        => 'nullable|string',
        ]);

        DB::transaction(function () use ($stay, $data, $request) {
            $fromRoom = Room::lockForUpdate()->findOrFail($data['from_room_id']);
            $toRoom   = Room::lockForUpdate()->findOrFail($data['to_room_id']);

            abort_if($toRoom->status !== 'available', 409, "La habitación {$toRoom->number} no está disponible.");

            $oldStayRoom = $stay->stayRooms()
                ->where('room_id', $fromRoom->id)
                ->where('is_active', true)
                ->firstOrFail();

            $oldStayRoom->update(['is_active' => false, 'check_out_date' => now()->toDateString()]);

            $newNights = max(1, (int) now()->diffInDays(Carbon::parse($stay->check_out_datetime)));

            StayRoom::create([
                'stay_id'         => $stay->id,
                'room_id'         => $toRoom->id,
                'check_in_date'   => now()->toDateString(),
                'check_out_date'  => Carbon::parse($stay->check_out_datetime)->toDateString(),
                'price_per_night' => $oldStayRoom->price_per_night,
                'nights'          => $newNights,
                'subtotal'        => $oldStayRoom->price_per_night * $newNights,
                'is_active'       => true,
            ]);

            $stay->transfers()->create([
                'from_room_id'   => $fromRoom->id,
                'to_room_id'     => $toRoom->id,
                'transferred_by' => $request->user()->id,
                'reason'         => $data['reason'] ?? null,
                'transferred_at' => now(),
                'notes'          => $data['notes'] ?? null,
            ]);

            $fromRoom->update(['status' => 'cleaning']);
            $toRoom->update(['status' => 'occupied']);

            broadcast(new RoomStatusChanged($fromRoom->refresh()))->toOthers();
            broadcast(new RoomStatusChanged($toRoom->refresh()))->toOthers();
        });

        $stay->load(['guest', 'stayRooms.room', 'transfers']);

        ActivityLog::record('stay.transfer', $request->user()->id, [
            'stay_id'      => $stay->id,
            'from_room_id' => $data['from_room_id'],
            'to_room_id'   => $data['to_room_id'],
            'reason'       => $data['reason'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Transferencia realizada.']);
    }

    public function payments(Request $request, Stay $stay): JsonResponse
    {
        $payments = $stay->payments()
            ->with(['receptionist:id,name', 'cancelledBy:id,name'])
            ->orderByDesc('payment_date')
            ->paginate($this->perPage($request, 50));

        return response()->json(['success' => true, 'data' => $payments]);
    }

    public function addPayment(Request $request, Stay $stay): JsonResponse
    {
        $data = $request->validate([
            'amount'                => 'required|numeric|min:0.01',
            'payment_method'        => 'required|in:cash,transfer,card',
            'payment_type'          => 'required|in:deposit,partial,final',
            'paid_by'               => 'required|in:guest,company,mixed',
            'payment_split_details' => 'nullable|array',
            'payment_date'          => 'nullable|date',
            'notes'                 => 'nullable|string',
        ]);

        $payment = DB::transaction(function () use ($stay, $data, $request) {
            $payment = $stay->payments()->create([
                'amount'                => $data['amount'],
                'payment_method'        => $data['payment_method'],
                'payment_type'          => $data['payment_type'],
                'paid_by'               => $data['paid_by'],
                'payment_split_details' => $data['payment_split_details'] ?? null,
                'receptionist_id'       => $request->user()->id,
                'payment_date'          => $data['payment_date'] ?? now(),
                'notes'                 => $data['notes'] ?? null,
            ]);

            $stay->increment('paid_amount', $data['amount']);

            return $payment;
        });

        ActivityLog::record('stay.payment', $request->user()->id, [
            'stay_id' => $stay->id,
            'amount'  => (float) $data['amount'],
            'method'  => $data['payment_method'],
            'type'    => $data['payment_type'],
        ]);

        return response()->json(['success' => true, 'data' => $payment, 'message' => 'Pago registrado.'], 201);
    }

    public function cancelPayment(Request $request, Stay $stay, Payment $payment): JsonResponse
    {
        abort_if($payment->stay_id !== $stay->id, 404, 'Pago no encontrado en esta estadia.');
        abort_if($payment->isCancelled(), 409, 'Este pago ya fue anulado.');

        $data = $request->validate([
            'reason' => 'required|string|min:5|max:500',
        ]);

        $user   = $request->user();
        $amount = (float) $payment->amount;

        DB::transaction(function () use ($payment, $stay, $data, $user, $amount) {
            $payment->update([
                'cancelled_at'        => now(),
                'cancelled_by_id'     => $user->id,
                'cancellation_reason' => $data['reason'],
            ]);

            $stay->decrement('paid_amount', $amount);
        });

        ActivityLog::record('stay.payment_cancelled', $user->id, [
            'stay_id'    => $stay->id,
            'payment_id' => $payment->id,
            'amount'     => $amount,
            'method'     => $payment->payment_method,
            'reason'     => $data['reason'],
        ]);

        $this->notifyAdminsOfCancellation(
            title:   'Pago anulado',
            message: sprintf(
                '%s anuló un pago de %s en la estadía de %s. Motivo: %s',
                $user->name,
                number_format($amount, 0, ',', '.'),
                optional($stay->guest)->full_name ?? 'huésped',
                $data['reason'],
            ),
            payload: [
                'stay_id'    => $stay->id,
                'payment_id' => $payment->id,
                'amount'     => $amount,
                'reason'     => $data['reason'],
                'by_user_id' => $user->id,
                'by_name'    => $user->name,
            ],
            actionUrl:    '/activity?tab=pagos',
            excludeUserId: $user->id,
        );

        return response()->json([
            'success' => true,
            'data'    => $payment->fresh(['receptionist', 'cancelledBy']),
            'message' => 'Pago anulado. Queda registrado en el historial.',
        ]);
    }

    /**
     * Crea una notificación para cada admin/superadmin (quienes tienen manage_users)
     * excepto el usuario que ejecutó la acción.
     */
    private function notifyAdminsOfCancellation(
        string $title,
        string $message,
        array $payload,
        string $actionUrl,
        string $excludeUserId,
        string $type = 'payment_cancelled',
    ): void {
        $adminIds = User::permission('manage_users')
            ->where('id', '!=', $excludeUserId)
            ->pluck('id');

        foreach ($adminIds as $userId) {
            Notification::create([
                'type'       => $type,
                'title'      => $title,
                'message'    => $message,
                'severity'   => 'warning',
                'payload'    => $payload,
                'action_url' => $actionUrl,
                'user_id'    => $userId,
            ]);
        }
    }

    public function addService(Request $request, Stay $stay): JsonResponse
    {
        abort_if($stay->status !== 'active', 409, 'Solo se pueden agregar servicios a estadías activas.');

        $data = $request->validate([
            'extra_service_id' => 'required|uuid|exists:extra_services,id',
            'quantity'         => 'required|integer|min:1',
        ]);

        $service = ExtraService::findOrFail($data['extra_service_id']);
        $total   = $service->price * $data['quantity'];

        $stayService = DB::transaction(function () use ($stay, $data, $service, $total, $request) {
            $stayService = $stay->services()->create([
                'extra_service_id' => $data['extra_service_id'],
                'quantity'         => $data['quantity'],
                'unit_price'       => $service->price,
                'total'            => $total,
                'applied_at'       => now(),
                'applied_by'       => $request->user()->id,
            ]);

            $stay->increment('total_amount', $total);

            return $stayService;
        });

        ActivityLog::record('stay.service', $request->user()->id, [
            'stay_id'      => $stay->id,
            'guest_name'   => $stay->guest?->full_name,
            'service_name' => $service->name,
            'quantity'     => $data['quantity'],
            'total'        => $total,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $stayService->load('extraService'),
            'message' => 'Servicio agregado.',
        ], 201);
    }
}
