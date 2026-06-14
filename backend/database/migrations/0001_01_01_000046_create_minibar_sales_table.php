<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minibar_sales', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('sale_number', 30)->unique();
            $table->string('customer_name', 150)->nullable();
            $table->string('customer_document', 50)->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_method', 20)->nullable();   // cash, transfer, card
            $table->string('status', 20)->default('pending');    // pending, paid, cancelled
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('registered_by')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('cancelled_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('paid_at');
            $table->index('created_at');
        });

        Schema::create('minibar_sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('minibar_sale_id')->constrained('minibar_sales')->cascadeOnDelete();
            $table->foreignUuid('minibar_product_id')->constrained('minibar_products')->restrictOnDelete();
            $table->string('product_name', 150);
            $table->string('product_code', 50)->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total', 12, 2);
            $table->timestamps();

            $table->index('minibar_sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minibar_sale_items');
        Schema::dropIfExists('minibar_sales');
    }
};
