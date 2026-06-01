<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            ActivityLog::record('login_failed', null, [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);

            return $this->error('Credenciales incorrectas.', [], 401);
        }

        if (! $user->is_active) {
            return $this->error('Usuario inactivo. Contacta al administrador.', [], 403);
        }

        // Revoke previous tokens for this user (single-session policy)
        $user->tokens()->delete();

        $token = $user->createToken('hotel-session', ['*'], now()->addMinutes(
            (int) config('sanctum.expiration', 480)
        ))->plainTextToken;

        ActivityLog::record('login', $user->id, ['ip' => $request->ip()]);

        return $this->success([
            'token' => $token,
            'user'  => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ], 'Sesión iniciada.');
    }

    public function logout(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $request->user()->currentAccessToken()->delete();

        ActivityLog::record('logout', $userId, ['ip' => $request->ip()]);

        return $this->success(null, 'Sesión cerrada.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles', 'permissions');

        return $this->success([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }
}
