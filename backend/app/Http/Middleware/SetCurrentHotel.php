<?php

namespace App\Http\Middleware;

use App\Support\HotelAccess;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentHotel
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $headerHotelId = $request->header('X-Hotel-Id');
        $defaultHotelId = HotelAccess::defaultHotelId($user);

        if ($headerHotelId && HotelAccess::canAccess($user, $headerHotelId)) {
            TenantContext::set($headerHotelId);
        } else {
            // Header ausente, inválido o de otra sesión (p. ej. superadmin) → hotel por defecto del usuario.
            TenantContext::set($defaultHotelId);
        }

        return $next($request);
    }
}
