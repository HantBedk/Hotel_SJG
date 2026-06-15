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

        if ($headerHotelId) {
            if (! HotelAccess::canAccess($user, $headerHotelId)) {
                return response()->json([
                    'success' => false,
                    'data'    => null,
                    'message' => 'No tienes acceso a este hotel.',
                    'errors'  => [],
                ], 403);
            }
            TenantContext::set($headerHotelId);
        } else {
            TenantContext::set(HotelAccess::defaultHotelId($user));
        }

        return $next($request);
    }
}
