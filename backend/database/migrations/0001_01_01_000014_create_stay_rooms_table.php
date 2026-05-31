<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stay_rooms', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('stay_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->restrictOnDelete();
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->decimal('price_per_night', 12, 2);
            $table->unsignedSmallInteger('nights');
            $table->decimal('subtotal', 12, 2);
            $table->boolean('is_active')->default(true); // false when transferred
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stay_rooms');
    }
};
