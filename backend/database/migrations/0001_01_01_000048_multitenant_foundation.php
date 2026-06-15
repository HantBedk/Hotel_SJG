<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private array $tenantTables = [
        'room_types',
        'houses',
        'seasons',
        'extra_services',
        'reservations',
        'stays',
        'minibar_sales',
        'assets',
        'repair_orders',
        'inventory_transactions',
        'activity_logs',
        'suggestions',
    ];

    public function up(): void
    {
        Schema::create('hotel_user', function (Blueprint $table) {
            $table->foreignUuid('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['hotel_id', 'user_id']);
            $table->index('user_id');
        });

        foreach ($this->tenantTables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'hotel_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->foreignUuid('hotel_id')->nullable()->after('id')->constrained('hotels')->cascadeOnDelete();
                });
            }
        }

        Schema::create('hotel_inventory', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->foreignUuid('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_threshold')->default(5);
            $table->string('location', 100)->nullable();
            $table->timestamps();

            $table->unique(['hotel_id', 'inventory_item_id']);
            $table->index(['hotel_id', 'current_stock']);
        });

        $this->backfillTenantData();
        $this->migrateInventoryStock();

        foreach ($this->tenantTables as $table) {
            if ($table !== 'activity_logs' && Schema::hasColumn($table, 'hotel_id')) {
                DB::statement("ALTER TABLE {$table} ALTER COLUMN hotel_id SET NOT NULL");
            }
        }

        if (Schema::hasColumn('inventory_items', 'current_stock')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropColumn(['current_stock', 'min_stock_threshold', 'location']);
            });
        }

        // Unicidades per-hotel
        Schema::table('assets', function (Blueprint $table) {
            $table->dropUnique(['asset_code']);
            $table->unique(['hotel_id', 'asset_code']);
        });

        Schema::table('minibar_sales', function (Blueprint $table) {
            $table->dropUnique(['sale_number']);
            $table->unique(['hotel_id', 'sale_number']);
        });
    }

    public function down(): void
    {
        Schema::table('minibar_sales', function (Blueprint $table) {
            $table->dropUnique(['hotel_id', 'sale_number']);
            $table->unique(['sale_number']);
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropUnique(['hotel_id', 'asset_code']);
            $table->unique(['asset_code']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_threshold')->default(5);
            $table->string('location', 100)->nullable();
        });

        Schema::dropIfExists('hotel_inventory');

        foreach (array_reverse($this->tenantTables) as $table) {
            if (Schema::hasColumn($table, 'hotel_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropConstrainedForeignId('hotel_id');
                });
            }
        }

        Schema::dropIfExists('hotel_user');
    }

    private function backfillTenantData(): void
    {
        $hotelId = DB::table('hotels')->orderBy('created_at')->value('id');
        if (! $hotelId) {
            return;
        }

        foreach ($this->tenantTables as $table) {
            DB::table($table)->whereNull('hotel_id')->update(['hotel_id' => $hotelId]);
        }

        // Reservas: preferir hotel de la habitación
        DB::statement('
            UPDATE reservations r
            SET hotel_id = rm.hotel_id
            FROM rooms rm
            WHERE r.room_id = rm.id AND r.hotel_id IS DISTINCT FROM rm.hotel_id
        ');

        // Estadías: hotel de la primera habitación activa
        DB::statement('
            UPDATE stays s
            SET hotel_id = sub.hotel_id
            FROM (
                SELECT DISTINCT ON (sr.stay_id) sr.stay_id, rm.hotel_id
                FROM stay_rooms sr
                JOIN rooms rm ON rm.id = sr.room_id
                ORDER BY sr.stay_id, sr.created_at
            ) sub
            WHERE s.id = sub.stay_id AND (s.hotel_id IS NULL OR s.hotel_id IS DISTINCT FROM sub.hotel_id)
        ');

        // Activos / reparaciones vía habitación
        DB::statement('
            UPDATE assets a
            SET hotel_id = rm.hotel_id
            FROM rooms rm
            WHERE a.room_id = rm.id AND a.hotel_id IS DISTINCT FROM rm.hotel_id
        ');

        DB::statement('
            UPDATE repair_orders ro
            SET hotel_id = a.hotel_id
            FROM assets a
            WHERE ro.asset_id = a.id AND ro.hotel_id IS DISTINCT FROM a.hotel_id
        ');

        $this->assignDefaultHotelsToStaff($hotelId);
    }

    private function assignDefaultHotelsToStaff(string $hotelId): void
    {
        $userIds = DB::table('users')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('hotel_user')
                    ->whereColumn('hotel_user.user_id', 'users.id');
            })
            ->pluck('id');

        foreach ($userIds as $userId) {
            $isSuperadmin = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $userId)
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('roles.name', 'superadmin')
                ->exists();

            if (! $isSuperadmin) {
                DB::table('hotel_user')->insert([
                    'hotel_id' => $hotelId,
                    'user_id'  => $userId,
                ]);
            }
        }
    }

    private function migrateInventoryStock(): void
    {
        $hotelId = DB::table('hotels')->orderBy('created_at')->value('id');
        if (! $hotelId) {
            return;
        }

        $items = DB::table('inventory_items')->get(['id', 'current_stock', 'min_stock_threshold', 'location']);
        foreach ($items as $item) {
            DB::table('hotel_inventory')->insert([
                'id'                  => (string) \Illuminate\Support\Str::uuid(),
                'hotel_id'            => $hotelId,
                'inventory_item_id'   => $item->id,
                'current_stock'       => $item->current_stock ?? 0,
                'min_stock_threshold' => $item->min_stock_threshold ?? 5,
                'location'            => $item->location,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }
    }
};
