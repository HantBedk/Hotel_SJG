<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('stay_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('from_room_id')->constrained('rooms')->restrictOnDelete();
            $table->foreignUuid('to_room_id')->constrained('rooms')->restrictOnDelete();
            $table->foreignUuid('transferred_by')->constrained('users')->restrictOnDelete();
            $table->string('reason')->nullable();
            $table->timestamp('transferred_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_transfers');
    }
};
