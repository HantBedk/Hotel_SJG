<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('minibar_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->foreignUuid('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
            $table->decimal('sale_price', 12, 2);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('damage_price', 12, 2)->nullable();
            $table->string('description', 255)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minibar_products');
    }
};
