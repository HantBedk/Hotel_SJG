<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\HotelAccess;
use App\Support\PersonaProvisioner;
use App\Support\PersonNameParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function getUsers(Request $request): JsonResponse
    {
        $hideSuperadmins = ! $request->user()?->hasRole('superadmin');

        $query = User::query()
            ->with(['persona.roles', 'persona', 'hotels'])
            ->join('personas', 'users.person_id', '=', 'personas.id')
            ->orderBy('personas.primer_apellido')
            ->orderBy('personas.primer_nombre')
            ->select('users.*');

        if ($hideSuperadmins) {
            $query->whereDoesntHave('persona.roles', fn ($q) => $q->where('name', 'superadmin'));
        }

        $users = $query->get()->map(fn ($u) => $this->formatUser($u));

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'primer_nombre'    => 'required_without:full_name|string|max:80',
            'segundo_nombre'   => 'nullable|string|max:80',
            'primer_apellido'  => 'required_without:full_name|string|max:80',
            'segundo_apellido' => 'nullable|string|max:80',
            'full_name'        => 'required_without:primer_nombre,primer_apellido|string|max:200',
            'document_number'  => 'nullable|string|max:50',
            'phone'            => 'nullable|string|max:30',
            'nationality_id'   => 'nullable|uuid|exists:nationalities,id',
            'email'            => 'required|email|unique:users,email',
            'password'         => 'required|string|min:6',
            'role'             => 'required|string|exists:roles,name',
            'hotel_ids'        => 'nullable|array',
            'hotel_ids.*'      => 'uuid|exists:hotels,id',
        ]);

        abort_if(
            $data['role'] === 'superadmin' && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para asignar el rol superadmin.',
        );

        $personFields = $this->personFieldsFromRequest($data);
        $user = PersonaProvisioner::ensureStaffUser(
            $personFields,
            [
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
            ],
            $data['role'],
        );

        $this->syncUserHotels($user, $data['role'], $data['hotel_ids'] ?? [], $request->user());

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user->load(['persona.roles', 'hotels'])),
            'message' => 'Usuario creado.',
        ], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        abort_if(
            $user->hasRole('superadmin') && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para modificar a este usuario.',
        );

        $data = $request->validate([
            'primer_nombre'    => 'sometimes|string|max:80',
            'segundo_nombre'   => 'nullable|string|max:80',
            'primer_apellido'  => 'sometimes|string|max:80',
            'segundo_apellido' => 'nullable|string|max:80',
            'full_name'        => 'sometimes|string|max:200',
            'document_number'  => 'nullable|string|max:50',
            'phone'            => 'nullable|string|max:30',
            'nationality_id'   => 'nullable|uuid|exists:nationalities,id',
            'email'            => 'sometimes|email|unique:users,email,' . $user->id,
            'password'         => 'nullable|string|min:6',
            'role'             => 'sometimes|string|exists:roles,name',
            'is_active'        => 'sometimes|boolean',
            'hotel_ids'        => 'nullable|array',
            'hotel_ids.*'      => 'uuid|exists:hotels,id',
        ]);

        abort_if(
            isset($data['role']) && $data['role'] === 'superadmin' && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para asignar el rol superadmin.',
        );

        $userUpdate = [];
        foreach (['email', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $userUpdate[$field] = $data[$field];
            }
        }
        if (! empty($data['password'])) {
            $userUpdate['password'] = Hash::make($data['password']);
        }
        if ($userUpdate !== []) {
            $user->update($userUpdate);
        }

        $personaFields = $this->personFieldsFromRequest(array_merge($user->persona?->toArray() ?? [], $data));
        $user->persona?->update($personaFields);

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        $role = $user->getRoleNames()->first() ?? $data['role'] ?? 'receptionist';
        if (array_key_exists('hotel_ids', $data) || isset($data['role'])) {
            $this->syncUserHotels($user, $role, $data['hotel_ids'] ?? $user->hotels()->pluck('hotels.id')->all(), $request->user());
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user->load(['persona.roles', 'persona', 'hotels'])),
            'message' => 'Usuario actualizado.',
        ]);
    }

    public function destroyUser(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id, 409, 'No puedes eliminar tu propia cuenta.');
        abort_if(
            $user->hasRole('superadmin') && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para desactivar a este usuario.',
        );
        abort_if($user->hasRole('superadmin'), 409, 'No se puede eliminar al superadmin.');

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json(['success' => true, 'message' => 'Usuario desactivado.']);
    }

    private function syncUserHotels(User $user, string $role, array $hotelIds, User $actor): void
    {
        if ($role === 'superadmin') {
            $user->hotels()->detach();

            return;
        }

        abort_if(empty($hotelIds), 422, 'Asigna al menos un hotel.');

        if (! HotelAccess::isSuperAdmin($actor)) {
            foreach ($hotelIds as $hotelId) {
                abort_unless(HotelAccess::canAccess($actor, $hotelId), 403, 'No puedes asignar un hotel al que no tienes acceso.');
            }
        }

        $user->hotels()->sync($hotelIds);
    }

    /** @param  array<string, mixed>  $data */
    private function personFieldsFromRequest(array $data): array
    {
        if (! empty($data['full_name']) && empty($data['primer_nombre'])) {
            $data = array_merge($data, PersonNameParser::split($data['full_name']));
        }

        return [
            'primer_nombre'    => $data['primer_nombre'] ?? '',
            'segundo_nombre'   => $data['segundo_nombre'] ?? null,
            'primer_apellido'  => $data['primer_apellido'] ?? '',
            'segundo_apellido' => $data['segundo_apellido'] ?? null,
            'document_type'    => $data['document_type'] ?? 'cc',
            'document_number'  => $data['document_number'] ?? ('USR-' . substr((string) ($data['email'] ?? uniqid()), 0, 12)),
            'phone'            => $data['phone'] ?? null,
            'nationality_id'   => $data['nationality_id'] ?? null,
            'email'            => $data['email'] ?? null,
        ];
    }

    private function formatUser(User $user): array
    {
        $persona = $user->persona;

        return [
            'id'               => $user->id,
            'person_id'        => $user->person_id,
            'name'             => $persona?->full_name,
            'primer_nombre'    => $persona?->primer_nombre,
            'segundo_nombre'   => $persona?->segundo_nombre,
            'primer_apellido'  => $persona?->primer_apellido,
            'segundo_apellido' => $persona?->segundo_apellido,
            'document_number'  => $persona?->document_number,
            'phone'            => $persona?->phone,
            'nationality_id'   => $persona?->nationality_id,
            'email'            => $user->email,
            'is_active'        => $user->is_active,
            'role'             => $persona?->roles->first()?->name,
            'hotel_ids'        => $user->hotels->pluck('id')->values(),
            'created_at'       => $user->created_at,
        ];
    }
}
