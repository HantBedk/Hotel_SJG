<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;
use App\Support\AuthUserPayload;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        // Auth manual (sin guard web) para evitar CSRF: el login emite token
        // Sanctum directamente; el frontend lo manda como Bearer en cada request.
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            ActivityLog::record('login_failed', null, [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);

            return $this->error('Credenciales incorrectas.', [], 401);
        }

        if (! $user->is_active) {
            return $this->error('Usuario inactivo. Contacta al administrador.', [], 403);
        }

        // Revoke any existing tokens to avoid accumulation
        $user->tokens()->delete();

        $token = $user->createToken('frontend')->plainTextToken;

        ActivityLog::record('login', $user->id, ['ip' => $request->ip()]);

        return $this->success([
            'token' => $token,
            'user'  => AuthUserPayload::build($user->load('roles', 'permissions', 'hotels')),
        ], 'Sesión iniciada.');
    }

    public function logout(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        if ($userId) {
            ActivityLog::record('logout', $userId, ['ip' => $request->ip()]);
        }

        return $this->success(null, 'Sesión cerrada.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        // Always return success to avoid user-enumeration
        $user = User::where('email', $request->email)->first();

        if ($user && $user->is_active) {
            $role = $user->getRoleNames()->first();

            // receptionist → notify admin + superadmin
            // admin         → notify superadmin only
            $targetRoles = match ($role) {
                'receptionist' => ['admin', 'superadmin'],
                'admin'        => ['superadmin'],
                default        => [],
            };

            if (!empty($targetRoles)) {
                $targets = User::role($targetRoles)->where('is_active', true)->get();

                foreach ($targets as $target) {
                    Notification::create([
                        'user_id'    => $target->id,
                        'type'       => 'password_reset_request',
                        'title'      => 'Solicitud de contraseña',
                        'message'    => "{$user->name} ({$user->email}) olvidó su contraseña y solicita restablecerla.",
                        'severity'   => 'warning',
                        'is_modal'   => false,
                        'action_url' => '/settings?tab=usuarios',
                        'payload'    => [
                            'user_id'   => $user->id,
                            'user_name' => $user->name,
                            'role'      => $role,
                        ],
                    ]);
                }
            }
        }

        return $this->success(null, 'Si el correo existe, se notificó al administrador.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles', 'permissions', 'hotels');

        return $this->success(AuthUserPayload::build($user));
    }
}
