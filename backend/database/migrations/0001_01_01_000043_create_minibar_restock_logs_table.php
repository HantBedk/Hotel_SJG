<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('minibar_restock_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('room_id')->constrained()->nullOnDelete();
            $table->foreignUuid('minibar_product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name', 150);
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_value', 12, 2)->default(0);
            $table->foreignUuid('performed_by')->constrained('users');
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minibar_restock_logs');
    }
};
