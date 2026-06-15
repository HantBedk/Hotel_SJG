<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class AdminRoleController extends Controller
{
    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('name')->get()->map(fn ($r) => [
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

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json(['success' => true, 'data' => $role->load('permissions'), 'message' => 'Permisos actualizados.']);
    }
}
