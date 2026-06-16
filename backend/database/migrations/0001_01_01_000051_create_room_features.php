<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /** @var list<string> */
    private const DEFAULT_FEATURES = [
        'Aire acondicionado',
        'TV',
        'Teléfono fijo',
        'Internet / WiFi',
        'Baño privado',
        'Minibar',
        'Balcón',
        'Caja fuerte',
    ];

    public function up(): void
    {
        Schema::create('room_features', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('hotel_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->unsignedSmallInteger('sort_order')->default(50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['hotel_id', 'name']);
        });

        Schema::create('room_room_feature', function (Blueprint $table) {
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_feature_id')->constrained('room_features')->cascadeOnDelete();
            $table->primary(['room_id', 'room_feature_id']);
        });

        $hotelIds = DB::table('hotels')->pluck('id');
        $now      = now();

        foreach ($hotelIds as $hotelId) {
            foreach (self::DEFAULT_FEATURES as $index => $name) {
                DB::table('room_features')->insert([
                    'id'         => (string) Str::uuid(),
                    'hotel_id'   => $hotelId,
                    'name'       => $name,
                    'sort_order' => $index * 10,
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('room_room_feature');
        Schema::dropIfExists('room_features');
    }
};
