<?php

namespace App\Providers;

use App\Models\Room;
use App\Observers\RoomObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        /*
         * Sin registros de servicios: Laravel resuelve bindings por auto-discovery
         * y los paquetes publican sus providers en bootstrap/app.php.
         */
    }

    public function boot(): void
    {
        Room::observe(RoomObserver::class);

        // Superadmin bypasses all permission checks
        Gate::before(function ($user) {
            if ($user->hasRole('superadmin')) {
                return true;
            }

            return null;
        });
    }
}
