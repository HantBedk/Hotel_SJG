<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\HotelAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function getUsers(Request $request): JsonResponse
    {
        // Los admin no deben ver perfiles de superadmin; solo otros superadmin pueden hacerlo.
        $hideSuperadmins = ! $request->user()?->hasRole('superadmin');

        $query = User::with('roles')->orderBy('name');
        if ($hideSuperadmins) {
            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'superadmin'));
        }

        $users = $query->with('hotels')->get()->map(fn ($u) => [
            'id'              => $u->id,
            'name'            => $u->name,
            'document_number' => $u->document_number,
            'phone'           => $u->phone,
            'email'           => $u->email,
            'is_active'       => $u->is_active,
            'role'            => $u->roles->first()?->name,
            'hotel_ids'       => $u->hotels->pluck('id')->values(),
            'created_at'      => $u->created_at,
        ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'document_number' => 'nullable|string|max:30',
            'phone'           => 'nullable|string|max:30',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:6',
            'role'            => 'required|string|exists:roles,name',
            'hotel_ids'       => 'nullable|array',
            'hotel_ids.*'     => 'uuid|exists:hotels,id',
        ]);

        // Solo un superadmin puede crear otro superadmin.
        abort_if(
            $data['role'] === 'superadmin' && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para asignar el rol superadmin.',
        );

        $user = User::create([
            'name'            => $data['name'],
            'document_number' => $data['document_number'] ?? null,
            'phone'           => $data['phone'] ?? null,
            'email'           => $data['email'],
            'password'        => Hash::make($data['password']),
            'is_active'       => true,
        ]);

        $user->syncRoles([$data['role']]);
        $this->syncUserHotels($user, $data['role'], $data['hotel_ids'] ?? [], $request->user());

        return response()->json([
            'success' => true,
            'data'    => array_merge($user->toArray(), ['role' => $data['role']]),
            'message' => 'Usuario creado.',
        ], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        // Solo un superadmin puede modificar a otro superadmin.
        abort_if(
            $user->hasRole('superadmin') && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para modificar a este usuario.',
        );

        $data = $request->validate([
            'name'            => 'sometimes|string|max:100',
            'document_number' => 'nullable|string|max:30',
            'phone'           => 'nullable|string|max:30',
            'email'           => 'sometimes|email|unique:users,email,' . $user->id,
            'password'        => 'nullable|string|min:6',
            'role'            => 'sometimes|string|exists:roles,name',
            'is_active'       => 'sometimes|boolean',
            'hotel_ids'       => 'nullable|array',
            'hotel_ids.*'     => 'uuid|exists:hotels,id',
        ]);

        // Y nadie que no sea superadmin puede otorgar el rol superadmin.
        abort_if(
            isset($data['role']) && $data['role'] === 'superadmin' && ! $request->user()->hasRole('superadmin'),
            403,
            'No tienes permiso para asignar el rol superadmin.',
        );

        $updateData = [];
        foreach (['name', 'document_number', 'phone', 'email', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        $role = $user->getRoleNames()->first() ?? $data['role'] ?? 'receptionist';
        if (array_key_exists('hotel_ids', $data) || isset($data['role'])) {
            $this->syncUserHotels($user, $role, $data['hotel_ids'] ?? $user->hotels()->pluck('hotels.id')->all(), $request->user());
        }

        return response()->json(['success' => true, 'data' => $user->load('roles', 'hotels'), 'message' => 'Usuario actualizado.']);
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
}
