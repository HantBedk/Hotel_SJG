<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\HotelAccess;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncStaffHotelAccess extends Command
{
    protected $signature = 'hotel:sync-staff-access {--dry-run : Solo mostrar cambios sin aplicarlos}';

    protected $description = 'Asigna hotel por defecto a personal sin filas en hotel_user';

    public function handle(): int
    {
        $defaultHotelId = DB::table('hotels')->orderBy('created_at')->value('id');

        if (! $defaultHotelId) {
            $this->warn('No hay hoteles en la base de datos.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $assigned = 0;

        User::query()
            ->with('persona')
            ->whereDoesntHave('hotels')
            ->orderBy('email')
            ->each(function (User $user) use ($defaultHotelId, $dryRun, &$assigned): void {
                $roles = $user->getRoleNames()->all();

                if (in_array('superadmin', $roles, true)) {
                    return;
                }

                if (! HotelAccess::rolesRequireHotels($roles)) {
                    return;
                }

                $this->line(sprintf(
                    '%s (%s) → hotel %s',
                    $user->email,
                    implode(', ', $roles),
                    $defaultHotelId,
                ));

                if (! $dryRun) {
                    DB::table('hotel_user')->insertOrIgnore([
                        'hotel_id' => $defaultHotelId,
                        'user_id'  => $user->id,
                    ]);
                }

                $assigned++;
            });

        $this->info($dryRun
            ? "Se asignarían {$assigned} usuario(s)."
            : "Asignados {$assigned} usuario(s) al hotel por defecto.");

        return self::SUCCESS;
    }
}
