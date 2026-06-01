<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('hotel_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_type_id')->constrained()->cascadeOnDelete();
            $table->string('number', 20);
            $table->unsignedSmallInteger('floor')->nullable();
            $table->string('status', 20)->default('available');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['hotel_id', 'number']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
