<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Persona;
use App\Support\PersonaProvisioner;
use App\Support\TenantContext;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuestController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $hotelId = TenantContext::id();
        $query   = Persona::guests()->with('nationality')->withStaysCountForHotel($hotelId);

        if ($document = $request->query('document')) {
            $query->where('document_number', $document);
        } elseif ($search = $request->query('search')) {
            $query->search($search);
        }

        $guests = $query
            ->orderBy('primer_apellido')
            ->orderBy('primer_nombre')
            ->paginate($this->perPage($request, 20));

        return response()->json(['success' => true, 'data' => $guests]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'primer_nombre'    => 'required_without:full_name|string|max:80',
            'segundo_nombre'   => 'nullable|string|max:80',
            'primer_apellido'  => 'required_without:full_name|string|max:80',
            'segundo_apellido' => 'nullable|string|max:80',
            'full_name'        => 'required_without:primer_nombre,primer_apellido|string|max:200',
            'document_type'    => 'required|in:cc,ce,passport,ti,rc',
            'document_number'  => 'required|string|max:50',
            'is_minor'         => 'nullable|boolean',
            'relationship'     => 'nullable|string|max:80',
            'email'            => 'nullable|email|max:200',
            'phone'            => 'nullable|string|max:30',
            'nationality_id'   => 'nullable|uuid|exists:nationalities,id',
            'birth_date'       => 'nullable|date',
            'notes'            => 'nullable|string',
        ]);

        $guest = PersonaProvisioner::findOrCreateGuest($data);

        return response()->json(
            ['success' => true, 'data' => $guest, 'message' => 'Huésped registrado.'],
            201
        );
    }

    public function show(Guest $guest): JsonResponse
    {
        $staysQuery = fn ($q) => $q->with('stayRooms.room');
        if ($hotelId = TenantContext::id()) {
            $staysQuery = fn ($q) => $q->where('hotel_id', $hotelId)->with('stayRooms.room');
        }

        $guest->load(['nationality', 'stays' => $staysQuery]);

        return response()->json(['success' => true, 'data' => $guest]);
    }

    public function update(Request $request, Guest $guest): JsonResponse
    {
        $data = $request->validate([
            'primer_nombre'    => 'sometimes|string|max:80',
            'segundo_nombre'   => 'nullable|string|max:80',
            'primer_apellido'  => 'sometimes|string|max:80',
            'segundo_apellido' => 'nullable|string|max:80',
            'full_name'        => 'sometimes|string|max:200',
            'document_type'    => 'sometimes|in:cc,ce,passport,ti,rc',
            'document_number'  => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('personas', 'document_number')->ignore($guest->id),
            ],
            'is_minor'       => 'nullable|boolean',
            'relationship'   => 'nullable|string|max:80',
            'email'          => 'nullable|email|max:200',
            'phone'          => 'nullable|string|max:30',
            'nationality_id' => 'nullable|uuid|exists:nationalities,id',
            'birth_date'     => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        if (! empty($data['full_name']) && empty($data['primer_nombre'])) {
            $data = array_merge($data, \App\Support\PersonNameParser::split($data['full_name']));
            unset($data['full_name']);
        }

        $guest->update(PersonaProvisioner::extractPersonFields(array_merge($guest->toArray(), $data)));

        return response()->json([
            'success' => true,
            'data'    => $guest->fresh('nationality'),
            'message' => 'Huésped actualizado.',
        ]);
    }

    public function destroy(Guest $guest): JsonResponse
    {
        if ($guest->user()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Este huésped tiene cuenta de usuario. Desactívala desde Usuarios antes de eliminarlo.',
            ], 422);
        }

        $guest->delete();

        return response()->json(['success' => true, 'message' => 'Huésped eliminado.']);
    }

    public function stays(Guest $guest): JsonResponse
    {
        $query = $guest->stays()->with(['stayRooms.room', 'payments'])->orderByDesc('check_in_datetime');

        if ($hotelId = TenantContext::id()) {
            $query->where('hotel_id', $hotelId);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }
}
