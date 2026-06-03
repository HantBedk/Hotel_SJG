<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\NewCheckIn;
use App\Events\ReservationStatusChanged;
use App\Events\RoomStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Models\Room;
use App\Models\Stay;
use App\Models\StayGuest;
use App\Models\StayRoom;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with(['guest', 'company', 'room.roomType', 'house', 'createdBy'])
            ->orderByDesc('start_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($guestId = $request->query('guest_id')) {
            $query->where('guest_id', $guestId);
        }

        if ($roomId = $request->query('room_id')) {
            $query->where('room_id', $roomId);
        }

        if ($from = $request->query('from')) {
            $query->where('end_date', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->where('start_date', '<=', $to);
        }

        if ($search = $request->query('search')) {
            $query->whereHas('guest', fn($q) =>
                $q->where('full_name', 'ilike', "%{$search}%")
                  ->orWhere('document_number', 'ilike', "%{$search}%")
            );
        }

        $reservations = $query->paginate($this->perPage($request, 20));

        return response()->json(['success' => true, 'data' => $reservations]);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $reservation->load(['guest.companions', 'company', 'room.roomType', 'house', 'createdBy', 'payments.receptionist', 'stay']);

        return response()->json(['success' => true, 'data' => $reservation]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_id'       => 'required_without:company_id|nullable|uuid|exists:guests,id',
            'company_id'     => 'nullable|uuid|exists:companies,id',
            'room_id'        => 'nullable|uuid|exists:rooms,id',
            'house_id'       => 'nullable|uuid|exists:houses,id',
            'start_date'     => 'required|date|after_or_equal:today',
            'end_date'       => 'required|date|after:start_date',
            'agreed_price'   => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        $start  = Carbon::parse($data['start_date']);
        $end    = Carbon::parse($data['end_date']);
        $nights = max(1, (int) $start->diffInDays($end));

        $reservation = DB::transaction(function () use ($data, $nights, $request) {
            if (!empty($data['room_id'])) {
                $this->assertNoOverlap($data['room_id'], $data['start_date'], $data['end_date']);
            }

            if (!empty($data['house_id'])) {
                $this->assertNoHouseOverlap($data['house_id'], $data['start_date'], $data['end_date']);
            }

            $reservation = Reservation::create([
                'guest_id'       => $data['guest_id'] ?? null,
                'company_id'     => $data['company_id'] ?? null,
                'room_id'        => $data['room_id'] ?? null,
                'house_id'       => $data['house_id'] ?? null,
                'status'         => 'pending',
                'start_date'     => $data['start_date'],
                'end_date'       => $data['end_date'],
                'nights'         => $nights,
                'agreed_price'   => $data['agreed_price'],
                'deposit_amount' => $data['deposit_amount'] ?? null,
                'payment_status' => 'pending',
                'created_by'     => $request->user()->id,
                'notes'          => $data['notes'] ?? null,
            ]);

            if (!empty($data['room_id'])) {
                $room = Room::find($data['room_id']);
                if ($room && $room->status === 'available') {
                    $room->update(['status' => 'reserved']);
                    broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
                }
            }

            broadcast(new ReservationStatusChanged($reservation->load('guest', 'room')))->toOthers();

            return $reservation;
        });

        $reservation->load(['guest', 'company', 'room.roomType', 'house', 'createdBy']);

        ActivityLog::record('reservation.created', $request->user()->id, [
            'reservation_id' => $reservation->id,
            'guest_name'     => $reservation->guest?->full_name,
            'start_date'     => $data['start_date'],
            'end_date'       => $data['end_date'],
            'agreed_price'   => $data['agreed_price'],
        ]);

        return response()->json(['success' => true, 'data' => $reservation, 'message' => 'Reserva creada.'], 201);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_id'       => 'required_without:company_id|nullable|uuid|exists:guests,id',
            'company_id'     => 'nullable|uuid|exists:companies,id',
            'room_ids'       => 'required|array|min:2',
            'room_ids.*'     => 'uuid|exists:rooms,id',
            'start_date'     => 'required|date|after_or_equal:today',
            'end_date'       => 'required|date|after:start_date',
            'prices'         => 'required|array',
            'prices.*'       => 'numeric|min:0',
            'billing_mode'   => 'required|in:single,individual',
            'deposit_amount' => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        $start  = Carbon::parse($data['start_date']);
        $end    = Carbon::parse($data['end_date']);
        $nights = max(1, (int) $start->diffInDays($end));
        $groupId = (string) \Illuminate\Support\Str::uuid();

        $reservations = DB::transaction(function () use ($data, $nights, $groupId, $request) {
            foreach ($data['room_ids'] as $roomId) {
                $this->assertNoOverlap($roomId, $data['start_date'], $data['end_date']);
            }

            $created = [];
            foreach ($data['room_ids'] as $roomId) {
                $price = $data['prices'][$roomId] ?? 0;
                $reservation = Reservation::create([
                    'group_id'       => $groupId,
                    'billing_mode'   => $data['billing_mode'],
                    'guest_id'       => $data['guest_id'] ?? null,
                    'company_id'     => $data['company_id'] ?? null,
                    'room_id'        => $roomId,
                    'status'         => 'pending',
                    'start_date'     => $data['start_date'],
                    'end_date'       => $data['end_date'],
                    'nights'         => $nights,
                    'agreed_price'   => $price * $nights,
                    'deposit_amount' => null,
                    'payment_status' => 'pending',
                    'created_by'     => $request->user()->id,
                    'notes'          => $data['notes'] ?? null,
                ]);

                $room = Room::find($roomId);
                if ($room && $room->status === 'available') {
                    $room->update(['status' => 'reserved']);
                    broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
                }

                broadcast(new ReservationStatusChanged($reservation->load('guest', 'room')))->toOthers();
                $created[] = $reservation;
            }

            return $created;
        });

        ActivityLog::record('reservation.group_created', $request->user()->id, [
            'group_id'      => $groupId,
            'room_count'    => count($data['room_ids']),
            'billing_mode'  => $data['billing_mode'],
            'start_date'    => $data['start_date'],
            'end_date'      => $data['end_date'],
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['group_id' => $groupId, 'reservations' => $reservations],
            'message' => 'Reservas masivas creadas.',
        ], 201);
    }

    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if(in_array($reservation->status, ['checked_in', 'cancelled', 'no_show']), 409, 'No se puede modificar esta reserva.');

        $data = $request->validate([
            'guest_id'       => 'sometimes|nullable|uuid|exists:guests,id',
            'company_id'     => 'sometimes|nullable|uuid|exists:companies,id',
            'room_id'        => 'sometimes|nullable|uuid|exists:rooms,id',
            'house_id'       => 'sometimes|nullable|uuid|exists:houses,id',
            'status'         => 'sometimes|in:pending,confirmed',
            'start_date'     => 'sometimes|date',
            'end_date'       => 'sometimes|date|after:start_date',
            'agreed_price'   => 'sometimes|numeric|min:0',
            'deposit_amount' => 'sometimes|nullable|numeric|min:0',
            'notes'          => 'sometimes|nullable|string',
        ]);

        DB::transaction(function () use ($reservation, $data) {
            $newRoomId   = $data['room_id'] ?? $reservation->room_id;
            $newStart    = $data['start_date'] ?? $reservation->start_date->toDateString();
            $newEnd      = $data['end_date'] ?? $reservation->end_date->toDateString();

            if ($newRoomId && ($newRoomId !== $reservation->room_id
                || $newStart !== $reservation->start_date->toDateString()
                || $newEnd !== $reservation->end_date->toDateString())
            ) {
                $this->assertNoOverlap($newRoomId, $newStart, $newEnd, $reservation->id);
            }

            // Recalculate nights if dates changed
            if (isset($data['start_date']) || isset($data['end_date'])) {
                $start  = Carbon::parse($newStart);
                $end    = Carbon::parse($newEnd);
                $data['nights'] = max(1, (int) $start->diffInDays($end));
            }

            // Release old room if room changed
            if (array_key_exists('room_id', $data) && $data['room_id'] !== $reservation->room_id) {
                if ($reservation->room_id) {
                    $oldRoom = Room::find($reservation->room_id);
                    if ($oldRoom && $oldRoom->status === 'reserved') {
                        $oldRoom->update(['status' => 'available']);
                        broadcast(new RoomStatusChanged($oldRoom->refresh()))->toOthers();
                    }
                }
                if ($data['room_id']) {
                    $newRoom = Room::find($data['room_id']);
                    if ($newRoom && $newRoom->status === 'available') {
                        $newRoom->update(['status' => 'reserved']);
                        broadcast(new RoomStatusChanged($newRoom->refresh()))->toOthers();
                    }
                }
            }

            $reservation->update($data);
            broadcast(new ReservationStatusChanged($reservation->load('guest', 'room')))->toOthers();
        });

        $reservation->load(['guest', 'company', 'room.roomType', 'house', 'createdBy']);

        ActivityLog::record('reservation.updated', $request->user()->id, [
            'reservation_id' => $reservation->id,
            'guest_name'     => $reservation->guest?->full_name,
            'status'         => $reservation->status,
            'start_date'     => $reservation->start_date->toDateString(),
            'end_date'       => $reservation->end_date->toDateString(),
        ]);

        return response()->json(['success' => true, 'data' => $reservation, 'message' => 'Reserva actualizada.']);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        abort_if($reservation->status === 'checked_in', 409, 'No se puede eliminar una reserva con estadía activa.');

        DB::transaction(function () use ($reservation) {
            if ($reservation->room_id) {
                $room = Room::find($reservation->room_id);
                if ($room && $room->status === 'reserved') {
                    $room->update(['status' => 'available']);
                    broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
                }
            }
            $reservation->update(['status' => 'cancelled']);
            $reservation->delete();
        });

        return response()->json(['success' => true, 'data' => null, 'message' => 'Reserva eliminada.']);
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if(in_array($reservation->status, ['checked_in', 'cancelled', 'no_show']), 409, 'Esta reserva no se puede cancelar.');

        $data = $request->validate(['notes' => 'nullable|string']);

        DB::transaction(function () use ($reservation, $data) {
            if ($reservation->room_id) {
                $room = Room::find($reservation->room_id);
                if ($room && $room->status === 'reserved') {
                    $room->update(['status' => 'available']);
                    broadcast(new RoomStatusChanged($room->refresh()))->toOthers();
                }
            }
            $reservation->update([
                'status' => 'cancelled',
                'notes'  => $data['notes'] ?? $reservation->notes,
            ]);
            broadcast(new ReservationStatusChanged($reservation->load('guest', 'room')))->toOthers();
        });

        ActivityLog::record('reservation.cancelled', $request->user()->id, [
            'reservation_id' => $reservation->id,
            'guest_name'     => $reservation->guest?->full_name,
        ]);

        return response()->json(['success' => true, 'data' => $reservation, 'message' => 'Reserva cancelada.']);
    }

    public function extend(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if(!in_array($reservation->status, ['pending', 'confirmed']), 409, 'Solo se pueden extender reservas activas.');

        $data = $request->validate([
            'end_date'     => 'required|date|after:' . $reservation->end_date->toDateString(),
            'agreed_price' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($reservation, $data) {
            if ($reservation->room_id) {
                $this->assertNoOverlap($reservation->room_id, $reservation->start_date->toDateString(), $data['end_date'], $reservation->id);
            }

            $newEnd    = Carbon::parse($data['end_date']);
            $newNights = max(1, (int) $reservation->start_date->diffInDays($newEnd));

            $reservation->update([
                'end_date'     => $data['end_date'],
                'nights'       => $newNights,
                'agreed_price' => $data['agreed_price'] ?? $reservation->agreed_price,
            ]);
        });

        return response()->json(['success' => true, 'data' => $reservation, 'message' => 'Reserva extendida.']);
    }

    public function checkIn(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if(!in_array($reservation->status, ['pending', 'confirmed']), 409, 'Solo se puede hacer check-in de reservas pendientes o confirmadas.');

        $data = $request->validate([
            'room_ids'            => 'required|array|min:1',
            'room_ids.*'          => 'uuid|exists:rooms,id',
            'prices'              => 'required|array',
            'prices.*'            => 'numeric|min:0',
            'check_in_datetime'   => 'nullable|date',
            'check_out_datetime'  => 'nullable|date',
            'notes'               => 'nullable|string',
        ]);

        $checkIn  = Carbon::parse($data['check_in_datetime'] ?? now());
        $checkOut = Carbon::parse($data['check_out_datetime'] ?? $reservation->end_date);
        $nights   = max(1, (int) $checkIn->diffInDays($checkOut));

        $stay = DB::transaction(function () use ($reservation, $data, $checkIn, $checkOut, $nights, $request) {
            $rooms = Room::whereIn('id', $data['room_ids'])->lockForUpdate()->get()->keyBy('id');

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
                'guest_id'           => $reservation->guest_id,
                'company_id'         => $reservation->company_id,
                'reservation_id'     => $reservation->id,
                'status'             => 'active',
                'check_in_datetime'  => $checkIn,
                'check_out_datetime' => $checkOut,
                'total_amount'       => $totalAmount,
                'paid_amount'        => (float) ($reservation->deposit_amount ?? 0),
                'created_by'         => $request->user()->id,
                'notes'              => $data['notes'] ?? $reservation->notes,
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

            if ($reservation->guest_id) {
                $stay->stayGuests()->create(['guest_id' => $reservation->guest_id, 'is_primary' => true]);
            }

            $reservation->update(['status' => 'checked_in']);
            broadcast(new ReservationStatusChanged($reservation->load('guest', 'room')))->toOthers();
            broadcast(new NewCheckIn($stay->load('guest', 'stayRooms')))->toOthers();

            return $stay;
        });

        $stay->load(['guest', 'company', 'stayRooms.room.roomType', 'createdBy']);

        ActivityLog::record('reservation.checkin', $request->user()->id, [
            'reservation_id' => $reservation->id,
            'stay_id'        => $stay->id,
            'guest_name'     => $stay->guest?->full_name,
            'room_ids'       => $data['room_ids'],
            'check_in'       => $stay->check_in_datetime,
            'check_out'      => $stay->check_out_datetime,
        ]);

        return response()->json(['success' => true, 'data' => $stay, 'message' => 'Check-in desde reserva realizado.'], 201);
    }

    public function addPayment(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if(in_array($reservation->status, ['cancelled', 'no_show']), 409, 'No se puede registrar pago en esta reserva.');

        $data = $request->validate([
            'amount'         => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,transfer,card',
            'payment_type'   => 'required|in:deposit,partial,final',
            'payment_date'   => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        $payment = DB::transaction(function () use ($reservation, $data, $request) {
            $payment = ReservationPayment::create([
                'reservation_id'  => $reservation->id,
                'amount'          => $data['amount'],
                'payment_method'  => $data['payment_method'],
                'payment_type'    => $data['payment_type'],
                'receptionist_id' => $request->user()->id,
                'payment_date'    => $data['payment_date'] ?? now(),
                'notes'           => $data['notes'] ?? null,
            ]);

            $totalPaid = $reservation->payments()->sum('amount') + $data['amount'];
            $paymentStatus = match(true) {
                $totalPaid >= $reservation->agreed_price => 'paid',
                $totalPaid > 0                           => 'partial',
                default                                  => 'pending',
            };

            $reservation->update([
                'payment_status' => $paymentStatus,
                'deposit_amount' => $totalPaid,
            ]);

            return $payment;
        });

        return response()->json(['success' => true, 'data' => $payment, 'message' => 'Pago registrado.'], 201);
    }

    private function assertNoOverlap(string $roomId, string $startDate, string $endDate, ?string $excludeId = null): void
    {
        $query = Reservation::where('room_id', $roomId)
            ->whereNotIn('status', ['cancelled', 'no_show', 'checked_in'])
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        abort_if($query->exists(), 409, 'La habitación ya tiene una reserva en ese rango de fechas.');
    }

    private function assertNoHouseOverlap(string $houseId, string $startDate, string $endDate, ?string $excludeId = null): void
    {
        $query = Reservation::where('house_id', $houseId)
            ->whereNotIn('status', ['cancelled', 'no_show', 'checked_in'])
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        abort_if($query->exists(), 409, 'La casa ya tiene una reserva en ese rango de fechas.');
    }
}
