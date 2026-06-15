<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\GuestCompanion;
use App\Support\TenantContext;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $hotelId = TenantContext::id();
        $query   = Guest::withStaysCountForHotel($hotelId);

        if ($hotelId) {
            $query->forHotel($hotelId);
        }

        if ($document = $request->query('document')) {
            $query->where('document_number', $document);
        } elseif ($search = $request->query('search')) {
            $query->search($search);
        }

        $guests = $query->orderBy('full_name')->paginate($this->perPage($request, 20));

        return response()->json(['success' => true, 'data' => $guests]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name'       => 'required|string|max:200',
            'document_type'   => 'required|in:cc,ce,passport,ti,rc',
            'document_number' => 'required|string|max:50|unique:guests,document_number',
            'is_minor'        => 'nullable|boolean',
            'relationship'    => 'nullable|string|max:80',
            'email'           => 'nullable|email|max:200',
            'phone'           => 'nullable|string|max:30',
            'nationality'     => 'nullable|string|max:80',
            'birth_date'      => 'nullable|date',
            'notes'           => 'nullable|string',
            'companions'      => 'nullable|array',
            'companions.*.name'            => 'required|string|max:200',
            'companions.*.document_type'   => 'nullable|string|max:20',
            'companions.*.document_number' => 'nullable|string|max:50',
            'companions.*.relationship'    => 'nullable|string|max:80',
            'companions.*.age'             => 'nullable|integer|min:0|max:120',
        ]);

        $guest = Guest::create($data);

        if (!empty($data['companions'])) {
            $guest->companions()->createMany($data['companions']);
        }

        return response()->json(
            ['success' => true, 'data' => $guest->load('companions'), 'message' => 'Huésped creado.'],
            201
        );
    }

    public function show(Guest $guest): JsonResponse
    {
        $staysQuery = fn ($q) => $q->with('stayRooms.room');
        if ($hotelId = TenantContext::id()) {
            $staysQuery = fn ($q) => $q->where('hotel_id', $hotelId)->with('stayRooms.room');
        }

        return response()->json([
            'success' => true,
            'data'    => $guest->load(['companions', 'stays' => $staysQuery]),
        ]);
    }

    public function update(Request $request, Guest $guest): JsonResponse
    {
        $data = $request->validate([
            'full_name'       => 'sometimes|string|max:200',
            'document_type'   => 'sometimes|in:cc,ce,passport,ti,rc',
            'document_number' => 'sometimes|string|max:50|unique:guests,document_number,' . $guest->id,
            'is_minor'        => 'nullable|boolean',
            'relationship'    => 'nullable|string|max:80',
            'email'           => 'nullable|email|max:200',
            'phone'           => 'nullable|string|max:30',
            'nationality'     => 'nullable|string|max:80',
            'birth_date'      => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        $guest->update($data);

        return response()->json(['success' => true, 'data' => $guest, 'message' => 'Huésped actualizado.']);
    }

    public function destroy(Guest $guest): JsonResponse
    {
        $guest->delete();

        return response()->json(['success' => true, 'message' => 'Huésped eliminado.']);
    }

    // ── Companions ────────────────────────────────────────────────────────────

    public function companions(Guest $guest): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $guest->companions]);
    }

    public function storeCompanion(Request $request, Guest $guest): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:200',
            'document_type'   => 'nullable|string|max:20',
            'document_number' => 'nullable|string|max:50',
            'relationship'    => 'nullable|string|max:80',
            'age'             => 'nullable|integer|min:0|max:120',
        ]);

        $companion = $guest->companions()->create($data);

        return response()->json(['success' => true, 'data' => $companion], 201);
    }

    public function destroyCompanion(Guest $guest, GuestCompanion $companion): JsonResponse
    {
        abort_if($companion->guest_id !== $guest->id, 404);
        $companion->delete();

        return response()->json(['success' => true, 'message' => 'Acompañante eliminado.']);
    }

    // ── Stay history ──────────────────────────────────────────────────────────

    public function stays(Guest $guest): JsonResponse
    {
        $query = $guest->stays()->with(['stayRooms.room', 'payments'])->orderByDesc('check_in_datetime');

        if ($hotelId = TenantContext::id()) {
            $query->where('hotel_id', $hotelId);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }
}
