<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['entry', 'exit_to_minibar', 'exit_to_housekeeping', 'adjustment', 'sale']);
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_value', 12, 2)->default(0);
            $table->foreignUuid('performed_by')->constrained('users');
            $table->foreignUuid('destination_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignUuid('destination_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
