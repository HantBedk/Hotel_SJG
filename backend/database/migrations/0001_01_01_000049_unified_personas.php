<?php

use App\Exceptions\IrreversibleMigrationException;
use App\Support\PersonNameParser;
use Database\Seeders\NationalitiesSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const MODEL_USER = 'App\\Models\\User';

    private const MODEL_PERSONA = 'App\\Models\\Persona';
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::create('nationalities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name')->unique();
            $table->string('iso_code', 2)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(50);
            $table->timestamps();
        });

        (new NationalitiesSeeder())->run();

        Schema::create('personas', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('primer_nombre', 80);
            $table->string('segundo_nombre', 80)->nullable();
            $table->string('primer_apellido', 80);
            $table->string('segundo_apellido', 80)->nullable();
            $table->string('document_type', 20);
            $table->string('document_number', 50)->unique();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->foreignUuid('nationality_id')->nullable()->constrained('nationalities')->nullOnDelete();
            $table->date('birth_date')->nullable();
            $table->boolean('is_minor')->default(false);
            $table->string('relationship', 80)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_number');
            $table->index('nationality_id');
        });


        DB::statement('CREATE INDEX personas_primer_nombre_trgm ON personas USING GIN (primer_nombre gin_trgm_ops)');
        DB::statement('CREATE INDEX personas_primer_apellido_trgm ON personas USING GIN (primer_apellido gin_trgm_ops)');
        DB::statement('CREATE INDEX personas_phone_trgm ON personas USING GIN (phone gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_personas_document_trgm ON personas USING gin (document_number gin_trgm_ops) WHERE deleted_at IS NULL');

        $guestRoleId = $this->ensureGuestRole();

        if (Schema::hasTable('guests')) {
            $this->migrateGuests($guestRoleId);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('person_id')->nullable()->unique()->constrained('personas')->nullOnDelete();
        });

        if (Schema::hasTable('users')) {
            $this->migrateUsers();
            $this->migrateUserRoles();
        }

        if (Schema::hasTable('guest_companions')) {
            $this->migrateCompanions($guestRoleId);
        }

        $this->renameGuestForeignKeys();

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['name', 'document_number', 'phone']);
        });

        Schema::dropIfExists('guest_companions');
        Schema::dropIfExists('guests');
    }

    public function down(): void
    {
        throw new IrreversibleMigrationException('La migración de personas no es reversible automáticamente.');
    }

    private function ensureGuestRole(): string
    {
        $existing = DB::table('roles')->where('name', 'guest')->where('guard_name', 'sanctum')->first();
        if ($existing) {
            return $existing->id;
        }

        $id = (string) Str::uuid();
        DB::table('roles')->insert([
            'id'         => $id,
            'name'       => 'guest',
            'guard_name' => 'sanctum',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function assignRole(string $personaId, string $roleId): void
    {
        DB::table('model_has_roles')->insertOrIgnore([
            'role_id'    => $roleId,
            'model_type' => self::MODEL_PERSONA,
            'model_id'   => $personaId,
        ]);
    }

    private function migrateGuests(string $guestRoleId): void
    {
        $guests = DB::table('guests')->whereNull('deleted_at')->get();

        foreach ($guests as $guest) {
            $names = PersonNameParser::split($guest->full_name);
            $nationalityId = NationalitiesSeeder::resolveId($guest->nationality);

            DB::table('personas')->insert([
                'id'               => $guest->id,
                'primer_nombre'    => $names['primer_nombre'] ?: 'Sin nombre',
                'segundo_nombre'   => $names['segundo_nombre'],
                'primer_apellido'  => $names['primer_apellido'] ?: '—',
                'segundo_apellido' => $names['segundo_apellido'],
                'document_type'    => $guest->document_type,
                'document_number'  => $guest->document_number,
                'email'            => $guest->email,
                'phone'            => $guest->phone,
                'nationality_id'   => $nationalityId,
                'birth_date'       => $guest->birth_date,
                'is_minor'         => $guest->is_minor ?? false,
                'relationship'     => $guest->relationship ?? null,
                'notes'            => $guest->notes,
                'created_at'       => $guest->created_at,
                'updated_at'       => $guest->updated_at,
                'deleted_at'       => $guest->deleted_at,
            ]);

            $this->assignRole($guest->id, $guestRoleId);
        }
    }

    private function migrateUsers(): void
    {
        foreach (DB::table('users')->get() as $user) {
            $personId = $this->resolvePersonIdForUser($user);
            DB::table('users')->where('id', $user->id)->update(['person_id' => $personId]);
        }
    }

    private function resolvePersonIdForUser(object $user): string
    {
        if ($user->document_number) {
            $existing = DB::table('personas')
                ->where('document_number', $user->document_number)
                ->value('id');

            if ($existing) {
                return $existing;
            }
        }

        return $this->createPersonaFromUser($user);
    }

    private function createPersonaFromUser(object $user): string
    {
        $personId = (string) Str::uuid();
        $names = PersonNameParser::split($user->name ?? '');
        $docNumber = $user->document_number ?: 'USR-' . substr($user->id, 0, 8);

        if (DB::table('personas')->where('document_number', $docNumber)->exists()) {
            $docNumber = 'USR-' . $user->id;
        }

        DB::table('personas')->insert([
            'id'               => $personId,
            'primer_nombre'    => $names['primer_nombre'] ?: 'Usuario',
            'segundo_nombre'   => $names['segundo_nombre'],
            'primer_apellido'  => $names['primer_apellido'] ?: 'Sistema',
            'segundo_apellido' => $names['segundo_apellido'],
            'document_type'    => 'cc',
            'document_number'  => $docNumber,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'created_at'       => $user->created_at,
            'updated_at'       => $user->updated_at,
        ]);

        return $personId;
    }

    private function migrateUserRoles(): void
    {
        $userRoles = DB::table('model_has_roles')
            ->where('model_type', self::MODEL_USER)
            ->get();

        foreach ($userRoles as $row) {
            $personId = DB::table('users')->where('id', $row->model_id)->value('person_id');
            if (! $personId) {
                continue;
            }

            $this->assignRole($personId, $row->role_id);
        }

        DB::table('model_has_roles')->where('model_type', self::MODEL_USER)->delete();

        $userPerms = DB::table('model_has_permissions')
            ->where('model_type', self::MODEL_USER)
            ->get();

        foreach ($userPerms as $row) {
            $personId = DB::table('users')->where('id', $row->model_id)->value('person_id');
            if (! $personId) {
                continue;
            }

            DB::table('model_has_permissions')->insertOrIgnore([
                'permission_id' => $row->permission_id,
                'model_type'    => self::MODEL_PERSONA,
                'model_id'      => $personId,
            ]);
        }

        DB::table('model_has_permissions')->where('model_type', self::MODEL_USER)->delete();
    }

    private function migrateCompanions(string $guestRoleId): void
    {
        $companions = DB::table('guest_companions')->get();

        foreach ($companions as $companion) {
            $docNumber = $companion->document_number;
            if (! $docNumber) {
                $docNumber = 'COMP-' . $companion->id;
            }

            if (DB::table('personas')->where('document_number', $docNumber)->exists()) {
                $docNumber = 'COMP-' . $companion->id;
            }

            $personId = (string) Str::uuid();
            $names = PersonNameParser::split($companion->name);

            DB::table('personas')->insert([
                'id'               => $personId,
                'primer_nombre'    => $names['primer_nombre'] ?: 'Acompañante',
                'segundo_nombre'   => $names['segundo_nombre'],
                'primer_apellido'  => $names['primer_apellido'] ?: '—',
                'segundo_apellido' => $names['segundo_apellido'],
                'document_type'    => $companion->document_type ?: 'cc',
                'document_number'  => $docNumber,
                'relationship'     => $companion->relationship,
                'is_minor'         => ($companion->age ?? 0) < 18,
                'created_at'       => $companion->created_at,
                'updated_at'       => $companion->updated_at,
            ]);

            $this->assignRole($personId, $guestRoleId);

            $latestStayId = DB::table('stays')
                ->where('guest_id', $companion->guest_id)
                ->orderByDesc('check_in_datetime')
                ->value('id');

            if ($latestStayId) {
                DB::table('stay_guests')->insertOrIgnore([
                    'id'         => (string) Str::uuid(),
                    'stay_id'    => $latestStayId,
                    'guest_id'   => $personId,
                    'is_primary' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function renameGuestForeignKeys(): void
    {
        $tables = [
            'stays'         => ['guest_id', false],
            'reservations'  => ['guest_id', true],
            'minibar_sales' => ['guest_id', true],
        ];

        foreach ($tables as $table => [$column, $nullable]) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                $blueprint->dropForeign([$column]);
            });

            DB::statement("ALTER TABLE {$table} RENAME COLUMN {$column} TO person_id");

            Schema::table($table, function (Blueprint $blueprint) use ($nullable) {
                $fk = $blueprint->foreign('person_id')->references('id')->on('personas');
                $nullable ? $fk->nullOnDelete() : $fk->restrictOnDelete();
            });
        }

        if (Schema::hasTable('stay_guests')) {
            Schema::table('stay_guests', function (Blueprint $table) {
                $table->dropForeign(['guest_id']);
                $table->dropUnique(['stay_id', 'guest_id']);
            });

            DB::statement('ALTER TABLE stay_guests RENAME COLUMN guest_id TO person_id');
            Schema::rename('stay_guests', 'stay_persons');

            Schema::table('stay_persons', function (Blueprint $table) {
                $table->foreign('person_id')->references('id')->on('personas')->cascadeOnDelete();
                $table->unique(['stay_id', 'person_id']);
            });
        }
    }
};
