<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('minibar_consumptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stay_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained();
            $table->string('product_name', 100);
            $table->integer('quantity');
            $table->enum('type', ['consumed', 'damaged', 'missing'])->default('consumed');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total', 12, 2);
            $table->timestamp('registered_at')->useCurrent();
            $table->foreignUuid('registered_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minibar_consumptions');
    }
};
