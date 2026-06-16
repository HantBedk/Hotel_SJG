<?php

use App\Models\User;
use App\Support\HotelAccess;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $defaultHotelId = DB::table('hotels')->orderBy('created_at')->value('id');

        if (! $defaultHotelId) {
            return;
        }

        User::query()
            ->with('persona')
            ->whereDoesntHave('hotels')
            ->each(function (User $user) use ($defaultHotelId): void {
                $roles = $user->getRoleNames()->all();

                if (in_array('superadmin', $roles, true)) {
                    return;
                }

                if (! HotelAccess::rolesRequireHotels($roles)) {
                    return;
                }

                DB::table('hotel_user')->insertOrIgnore([
                    'hotel_id' => $defaultHotelId,
                    'user_id'  => $user->id,
                ]);
            });
    }

    public function down(): void
    {
        // No reversible: no se puede distinguir asignaciones automáticas de manuales.
    }
};
