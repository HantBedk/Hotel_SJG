<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('inventory_categories');
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->string('brand', 100)->nullable();
            $table->string('presentation', 100)->nullable();
            $table->string('unit', 50)->default('unidad');
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_threshold')->default(5);
            $table->date('expiry_date')->nullable();
            $table->string('supplier', 150)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->string('location', 100)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['current_stock', 'min_stock_threshold']);
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
