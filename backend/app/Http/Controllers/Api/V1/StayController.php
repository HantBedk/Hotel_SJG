<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\RoomStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\Room;
use App\Models\Stay;
use App\Models\StayGuest;
use App\Models\StayRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StayController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Stay::with(['guest', 'company', 'stayRooms.room.roomType'])
            ->orderByDesc('check_in_datetime');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $stays = $query->paginate(20);

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
            // Lock all requested rooms to prevent double check-in
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
                $room = $rooms->get($roomId);
                $pricePerNight = $data['prices'][$roomId] ?? $room->roomType->base_price;

                StayRoom::create([
                    'stay_id'        => $stay->id,
                    'room_id'        => $roomId,
                    'check_in_date'  => $checkIn->toDateString(),
                    'check_out_date' => $checkOut->toDateString(),
                    'price_per_night' => $pricePerNight,
                    'nights'         => $nights,
                    'subtotal'       => $pricePerNight * $nights,
                    'is_active'      => true,
                ]);

                $room->update(['status' => 'occupied']);
                broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
            }

            // Register all guests linked to this stay
            $stay->stayGuests()->create(['guest_id' => $data['guest_id'], 'is_primary' => true]);
            foreach ($data['additional_guest_ids'] ?? [] as $guestId) {
                if ($guestId !== $data['guest_id']) {
                    $stay->stayGuests()->create(['guest_id' => $guestId, 'is_primary' => false]);
                }
            }

            return $stay;
        });

        $stay->load(['guest', 'company', 'stayRooms.room.roomType', 'stayGuests.guest', 'createdBy']);

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

        DB::transaction(function () use ($stay, $checkoutAt, $data) {
            $stay->update([
                'status'                    => 'checked_out',
                'actual_check_out_datetime' => $checkoutAt,
                'late_checkout_fee'         => $data['late_checkout_fee'] ?? null,
                'notes'                     => $data['notes'] ?? $stay->notes,
            ]);

            foreach ($stay->activeStayRooms as $stayRoom) {
                $stayRoom->room->update(['status' => 'cleaning']);
                broadcast(new RoomStatusChanged($stayRoom->room->refresh()))->toOthers();
            }
        });

        return response()->json(['success' => true, 'data' => $stay->refresh(), 'message' => 'Checkout realizado.']);
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

            // Close old stay_room, open new one
            $oldStayRoom = $stay->stayRooms()
                ->where('room_id', $fromRoom->id)
                ->where('is_active', true)
                ->firstOrFail();

            $oldStayRoom->update(['is_active' => false, 'check_out_date' => now()->toDateString()]);

            $newNights = max(1, now()->diffInDays(Carbon::parse($stay->check_out_datetime)));

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

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Transferencia realizada.']);
    }

    public function addPayment(Request $request, Stay $stay): JsonResponse
    {
        $data = $request->validate([
            'amount'                 => 'required|numeric|min:0.01',
            'payment_method'         => 'required|in:cash,transfer,card',
            'payment_type'           => 'required|in:deposit,partial,final',
            'paid_by'                => 'required|in:guest,company,mixed',
            'payment_split_details'  => 'nullable|array',
            'payment_date'           => 'nullable|date',
            'notes'                  => 'nullable|string',
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

        return response()->json(['success' => true, 'data' => $payment, 'message' => 'Pago registrado.'], 201);
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

        return response()->json([
            'success' => true,
            'data'    => $stayService->load('extraService'),
            'message' => 'Servicio agregado.',
        ], 201);
    }
}
