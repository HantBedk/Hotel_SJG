<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Persona;
use App\Models\User;
use App\Support\HotelAccess;
use App\Support\PersonaProvisioner;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPersonaController extends Controller
{
    use Paginates;

    private const LOGIN_ROLES = ['admin', 'superadmin', 'receptionist'];

    public function index(Request $request): JsonResponse
    {
        $hideSuperadmins = ! $request->user()?->hasRole('superadmin');

        $query = Persona::query()
            ->with(['roles', 'nationality', 'user.hotels'])
            ->withCount('stays');

        if ($hideSuperadmins) {
            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'superadmin'));
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->search($search);
        }

        if ($role = $request->query('role')) {
            $query->role($role);
        }

        $personas = $query
            ->orderBy('primer_apellido')
            ->orderBy('primer_nombre')
            ->paginate($this->perPage($request, 50));

        $personas->getCollection()->transform(fn (Persona $p) => $this->formatPersona($p));

        return response()->json(['success' => true, 'data' => $personas]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->validationRules());

        $this->authorizeRoleAssignment($request, $data['roles']);
        $this->validateStaffEmail($data['roles'], $data['email'] ?? null, null);

        $persona = Persona::create(PersonaProvisioner::extractPersonFields($data));
        $persona->syncRoles($data['roles']);
        $this->syncPersonaHotels($persona, $data['roles'], $data['hotel_ids'] ?? [], $request->user());

        return response()->json([
            'success' => true,
            'data'    => $this->formatPersona($persona->fresh(['roles', 'nationality', 'user.hotels'])->loadCount('stays')),
            'message' => 'Persona creada.',
        ], 201);
    }

    public function update(Request $request, Persona $persona): JsonResponse
    {
        $this->authorizePersonaAccess($request, $persona);

        $data = $request->validate($this->validationRules($persona->id, partial: true));

        $roles = $data['roles'] ?? $persona->roles->pluck('name')->all();

        if (isset($data['roles'])) {
            $this->authorizeRoleAssignment($request, $data['roles'], $persona);
        }

        $email = $data['email'] ?? $persona->email;
        $this->validateStaffEmail($roles, $email, $persona->user);

        $personFields = PersonaProvisioner::extractPersonFields(
            array_merge($persona->toArray(), $data),
        );
        $persona->update($personFields);

        if (isset($data['roles'])) {
            $persona->syncRoles($data['roles']);
        }

        if (array_key_exists('hotel_ids', $data) || isset($data['roles'])) {
            $hotelIds = $data['hotel_ids']
                ?? $persona->user?->hotels()->pluck('hotels.id')->all()
                ?? [];
            $this->syncPersonaHotels($persona->fresh(['user']), $roles, $hotelIds, $request->user());
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatPersona($persona->fresh(['roles', 'nationality', 'user.hotels'])->loadCount('stays')),
            'message' => 'Persona actualizada.',
        ]);
    }

    public function destroy(Request $request, Persona $persona): JsonResponse
    {
        $this->authorizePersonaAccess($request, $persona);

        if ($persona->user) {
            return response()->json([
                'success' => false,
                'message' => 'Esta persona tiene cuenta de usuario. Elimínala desde Usuarios antes de borrar la persona.',
            ], 422);
        }

        if ($persona->id === $request->user()?->person_id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propia persona.',
            ], 422);
        }

        $persona->delete();

        return response()->json(['success' => true, 'message' => 'Persona eliminada.']);
    }

    /** @return array<string, mixed> */
    private function formatPersona(Persona $persona): array
    {
        $hotels = $persona->user?->hotels ?? collect();

        return [
            'id'               => $persona->id,
            'full_name'        => $persona->full_name,
            'primer_nombre'    => $persona->primer_nombre,
            'segundo_nombre'   => $persona->segundo_nombre,
            'primer_apellido'  => $persona->primer_apellido,
            'segundo_apellido' => $persona->segundo_apellido,
            'document_type'    => $persona->document_type,
            'document_number'  => $persona->document_number,
            'email'            => $persona->email,
            'phone'            => $persona->phone,
            'nationality_id'   => $persona->nationality_id,
            'nationality_name' => $persona->nationality?->name,
            'birth_date'       => $persona->birth_date?->format('Y-m-d'),
            'notes'            => $persona->notes,
            'roles'            => $persona->roles->pluck('name')->values()->all(),
            'hotel_ids'        => $hotels->pluck('id')->values()->all(),
            'hotel_names'      => $hotels->pluck('name')->values()->all(),
            'has_login'        => $persona->user !== null,
            'user_email'       => $persona->user?->email,
            'user_active'      => $persona->user?->is_active,
            'stays_count'      => $persona->stays_count ?? $persona->stays()->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function validationRules(?string $personaId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required_without:full_name';

        return [
            'primer_nombre'    => "{$required}|string|max:80",
            'segundo_nombre'   => 'nullable|string|max:80',
            'primer_apellido'  => "{$required}|string|max:80",
            'segundo_apellido' => 'nullable|string|max:80',
            'full_name'        => 'required_without:primer_nombre,primer_apellido|string|max:200',
            'document_type'    => ($partial ? 'sometimes|' : 'required|').'in:cc,ce,passport,ti,rc',
            'document_number'  => [
                $partial ? 'sometimes' : 'required',
                'string',
                'max:50',
                Rule::unique('personas', 'document_number')->ignore($personaId),
            ],
            'email'            => 'nullable|email|max:200',
            'phone'            => 'nullable|string|max:30',
            'nationality_id'   => 'nullable|uuid|exists:nationalities,id',
            'birth_date'       => 'nullable|date',
            'notes'            => 'nullable|string|max:2000',
            'roles'            => ($partial ? 'sometimes|' : 'required|').'array|min:1',
            'roles.*'          => 'string|exists:roles,name',
            'hotel_ids'        => 'nullable|array',
            'hotel_ids.*'      => 'uuid|exists:hotels,id',
        ];
    }

    /** @param  array<int, string>  $roles */
    private function authorizeRoleAssignment(Request $request, array $roles, ?Persona $persona = null): void
    {
        if ($request->user()?->hasRole('superadmin')) {
            return;
        }

        abort_if(
            in_array('superadmin', $roles, true),
            403,
            'No tienes permiso para asignar el rol superadmin.',
        );

        if ($persona?->hasRole('superadmin')) {
            abort(403, 'No puedes modificar los roles de una persona superadmin.');
        }
    }

    private function authorizePersonaAccess(Request $request, Persona $persona): void
    {
        if ($request->user()?->hasRole('superadmin')) {
            return;
        }

        abort_if(
            $persona->hasRole('superadmin'),
            403,
            'No tienes permiso para modificar esta persona.',
        );
    }

    /** @param  array<int, string>  $roles */
    private function validateStaffEmail(array $roles, ?string $email, ?User $existingUser): void
    {
        $effectiveEmail = filled($email) ? $email : $existingUser?->email;

        if (HotelAccess::rolesRequireHotels($roles)) {
            PersonaProvisioner::assertRealStaffEmail($effectiveEmail);
        }

        $needsLogin = count(array_intersect($roles, self::LOGIN_ROLES)) > 0;

        abort_if(
            $needsLogin && ! filled($effectiveEmail),
            422,
            'Los roles con acceso al sistema requieren correo electrónico.',
        );
    }

    /** @param  array<int, string>  $roles  @param  array<int, string>  $hotelIds */
    private function syncPersonaHotels(Persona $persona, array $roles, array $hotelIds, User $actor): void
    {
        if (! HotelAccess::rolesRequireHotels($roles)) {
            $persona->user?->hotels()->detach();

            return;
        }

        $email = $persona->email ?? $persona->user?->email;
        PersonaProvisioner::assertRealStaffEmail($email);

        $user = PersonaProvisioner::ensureUserForHotelAccess($persona, $email);
        HotelAccess::syncHotelsForRoles($user, $roles, $hotelIds, $actor);
    }
}
