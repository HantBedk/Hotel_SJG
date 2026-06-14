<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\Hotel;
use App\Models\House;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Season;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Permission;
use App\Models\Role;

class AdminController extends Controller
{
    // ── Hotel info ─────────────────────────────────────────────────────────────

    public function getHotelInfo(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Hotel::firstOrFail()]);
    }

    public function updateHotelInfo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'sometimes|string|max:150',
            'nit'     => 'sometimes|string|max:30',
            'address' => 'nullable|string|max:200',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email|max:100',
            'city'    => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
        ]);

        $hotel = Hotel::firstOrFail();
        $hotel->update($data);

        return response()->json(['success' => true, 'data' => $hotel, 'message' => 'Información del hotel actualizada.']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:2048']);

        $hotel    = Hotel::firstOrFail();
        $old      = $hotel->logo_path;
        $path     = $request->file('logo')->store('logos', 'public');
        $hotel->update(['logo_path' => $path]);

        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        return response()->json([
            'success' => true,
            'data'    => ['logo_path' => $path, 'logo_url' => Storage::disk('public')->url($path)],
            'message' => 'Logo actualizado.',
        ]);
    }

    // ── Room types ─────────────────────────────────────────────────────────────

    public function getRoomTypes(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => RoomType::orderBy('name')->get()]);
    }

    public function storeRoomType(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'description'   => 'nullable|string|max:500',
            'base_price'    => 'required|numeric|min:0',
            'max_occupancy' => 'required|integer|min:1|max:20',
            'amenities'     => 'nullable|array',
            'amenities.*'   => 'string|max:100',
        ]);

        $type = RoomType::create($data);
        return response()->json(['success' => true, 'data' => $type, 'message' => 'Tipo creado.'], 201);
    }

    public function updateRoomType(Request $request, RoomType $roomType): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'description'   => 'nullable|string|max:500',
            'base_price'    => 'sometimes|numeric|min:0',
            'max_occupancy' => 'sometimes|integer|min:1|max:20',
            'amenities'     => 'nullable|array',
            'amenities.*'   => 'string|max:100',
        ]);

        $roomType->update($data);
        return response()->json(['success' => true, 'data' => $roomType, 'message' => 'Tipo actualizado.']);
    }

    public function destroyRoomType(RoomType $roomType): JsonResponse
    {
        abort_if($roomType->rooms()->exists(), 409, 'No se puede eliminar un tipo con habitaciones asignadas.');
        $roomType->delete();
        return response()->json(['success' => true, 'message' => 'Tipo eliminado.']);
    }

    // ── Houses ─────────────────────────────────────────────────────────────────

    public function getHouses(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => House::with('rooms')->orderBy('name')->get()]);
    }

    public function storeHouse(Request $request): JsonResponse
    {
        $data  = $request->validate([
            'name'  => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
        ]);
        $house = House::create($data);
        return response()->json(['success' => true, 'data' => $house, 'message' => 'Casa creada.'], 201);
    }

    public function updateHouse(Request $request, House $house): JsonResponse
    {
        $data = $request->validate([
            'name'   => 'sometimes|string|max:100',
            'price'  => 'sometimes|numeric|min:0',
            'active' => 'sometimes|boolean',
        ]);
        $house->update($data);
        return response()->json(['success' => true, 'data' => $house->load('rooms'), 'message' => 'Casa actualizada.']);
    }

    public function destroyHouse(House $house): JsonResponse
    {
        $house->rooms()->update(['house_id' => null]);
        $house->delete();
        return response()->json(['success' => true, 'message' => 'Casa eliminada.']);
    }

    // ── Rooms (admin view, includes inactive) ─────────────────────────────────

    public function getAllRooms(): JsonResponse
    {
        $rooms = Room::with(['roomType', 'house'])->orderByRaw('floor NULLS LAST, number')->get();
        return response()->json(['success' => true, 'data' => $rooms]);
    }

    public function storeRoom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'required|uuid|exists:room_types,id',
            'house_id'     => 'nullable|uuid|exists:houses,id',
            'number'       => 'required|string|max:20|unique:rooms,number',
            'floor'        => 'nullable|integer|min:1|max:50',
            'notes'        => 'nullable|string|max:500',
        ]);

        $hotel        = Hotel::firstOrFail();
        $data['hotel_id'] = $hotel->id;
        $data['status']   = 'available';
        $room         = Room::create($data);

        return response()->json(['success' => true, 'data' => $room->load(['roomType', 'house']), 'message' => 'Habitación creada.'], 201);
    }

    public function updateRoom(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'sometimes|uuid|exists:room_types,id',
            'house_id'     => 'nullable|uuid|exists:houses,id',
            'number'       => 'sometimes|string|max:20|unique:rooms,number,' . $room->id,
            'floor'        => 'nullable|integer|min:1|max:50',
            'notes'        => 'nullable|string|max:500',
            'is_active'    => 'sometimes|boolean',
        ]);

        $room->update($data);
        return response()->json(['success' => true, 'data' => $room->load(['roomType', 'house']), 'message' => 'Habitación actualizada.']);
    }

    public function destroyRoom(Room $room): JsonResponse
    {
        abort_if($room->status === 'occupied', 409, 'No se puede eliminar una habitación ocupada.');
        $room->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Habitación desactivada.']);
    }

    public function massUpdateRoomPrices(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_type_id' => 'required|uuid|exists:room_types,id',
            'base_price'   => 'required|numeric|min:0',
        ]);

        $type = RoomType::findOrFail($data['room_type_id']);
        $type->update(['base_price' => $data['base_price']]);

        return response()->json([
            'success' => true,
            'data'    => $type,
            'message' => "Precio actualizado para tipo \"{$type->name}\".",
        ]);
    }

    // ── Seasons ────────────────────────────────────────────────────────────────

    public function getSeasons(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Season::orderBy('start_date')->get()]);
    }

    public function storeSeason(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'multiplier' => 'required|numeric|min:0.1|max:10',
            'active'     => 'sometimes|boolean',
        ]);

        $season = Season::create($data);
        return response()->json(['success' => true, 'data' => $season, 'message' => 'Temporada creada.'], 201);
    }

    public function updateSeason(Request $request, Season $season): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date|after:start_date',
            'multiplier' => 'sometimes|numeric|min:0.1|max:10',
            'active'     => 'sometimes|boolean',
        ]);

        $season->update($data);
        return response()->json(['success' => true, 'data' => $season, 'message' => 'Temporada actualizada.']);
    }

    public function destroySeason(Season $season): JsonResponse
    {
        $season->delete();
        return response()->json(['success' => true, 'message' => 'Temporada eliminada.']);
    }

    // ── Extra services ─────────────────────────────────────────────────────────

    public function getExtraServices(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => ExtraService::orderBy('name')->get()]);
    }

    public function storeExtraService(Request $request): JsonResponse
    {
        $data    = $request->validate([
            'name'        => 'required|string|max:100',
            'price'       => 'required|numeric|min:0',
            'description' => 'nullable|string|max:300',
        ]);
        $service = ExtraService::create(array_merge($data, ['active' => true]));
        return response()->json(['success' => true, 'data' => $service, 'message' => 'Servicio creado.'], 201);
    }

    public function updateExtraService(Request $request, ExtraService $extraService): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'price'       => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:300',
            'active'      => 'sometimes|boolean',
        ]);
        $extraService->update($data);
        return response()->json(['success' => true, 'data' => $extraService, 'message' => 'Servicio actualizado.']);
    }

    public function destroyExtraService(ExtraService $extraService): JsonResponse
    {
        $extraService->update(['active' => false]);
        return response()->json(['success' => true, 'message' => 'Servicio desactivado.']);
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    public function getUsers(): JsonResponse
    {
        // Los admin no deben ver perfiles de superadmin; solo otros superadmin pueden hacerlo.
        $hideSuperadmins = ! auth()->user()?->hasRole('superadmin');

        $query = User::with('roles')->orderBy('name');
        if ($hideSuperadmins) {
            $query->whereDoesntHave('roles', fn($q) => $q->where('name', 'superadmin'));
        }

        $users = $query->get()->map(fn($u) => [
            'id'              => $u->id,
            'name'            => $u->name,
            'document_number' => $u->document_number,
            'phone'           => $u->phone,
            'email'           => $u->email,
            'is_active'       => $u->is_active,
            'role'            => $u->roles->first()?->name,
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
        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return response()->json(['success' => true, 'data' => $user->load('roles'), 'message' => 'Usuario actualizado.']);
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

    // ── Roles & permissions ────────────────────────────────────────────────────

    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('name')->get()->map(fn($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'permissions' => $r->permissions->pluck('name'),
        ]);

        return response()->json(['success' => true, 'data' => $roles]);
    }

    public function getPermissions(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Permission::orderBy('name')->pluck('name')]);
    }

    public function updateRolePermissions(Request $request, Role $role): JsonResponse
    {
        abort_if($role->name === 'superadmin', 403, 'No se pueden modificar los permisos del superadmin.');

        $data = $request->validate([
            'permissions'   => 'present|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->syncPermissions($data['permissions']);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json(['success' => true, 'data' => $role->load('permissions'), 'message' => 'Permisos actualizados.']);
    }
}
