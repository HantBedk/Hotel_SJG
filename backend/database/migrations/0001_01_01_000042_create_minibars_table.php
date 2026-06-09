<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('minibars', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('name', 100)->nullable();
            $table->string('notes', 500)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique('room_id'); // 1 minibar por habitación
        });

        // Backfill: para cada habitación que ya tiene productos en room_minibars,
        // crear un Minibar implícito.
        $rooms = DB::table('room_minibars')->select('room_id')->distinct()->pluck('room_id');
        foreach ($rooms as $roomId) {
            DB::table('minibars')->insert([
                'id'         => DB::raw('gen_random_uuid()'),
                'room_id'    => $roomId,
                'active'     => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('minibars');
    }
};
