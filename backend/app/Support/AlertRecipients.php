<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;

/** Destinatarios de alertas operativas de recepción por hotel. */
class AlertRecipients
{
    /**
     * Personal operativo activo con acceso al hotel indicado.
     *
     * @return Collection<int, string>
     */
    public static function forHotel(?string $hotelId = null): Collection
    {
        $ids = User::role(['receptionist', 'admin', 'superadmin'])
            ->where('is_active', true)
            ->pluck('id')
            ->merge(
                User::permission(['check_in', 'manage_reservations', 'check_out'])
                    ->where('is_active', true)
                    ->pluck('id'),
            )
            ->unique()
            ->values();

        if (! $hotelId) {
            return $ids;
        }

        return $ids->filter(function (string $userId) use ($hotelId) {
            $user = User::query()->with('persona.roles')->find($userId);
            if (! $user) {
                return false;
            }

            if ($user->hasRole('superadmin')) {
                return true;
            }

            return $user->hotels()->where('hotels.id', $hotelId)->exists();
        })->values();
    }
}
