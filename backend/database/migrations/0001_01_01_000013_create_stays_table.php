<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stays', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('guest_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('reservation_id')->nullable(); // FK added in Fase 2
            $table->string('status', 20)->default('active'); // active, extended, checked_out
            $table->timestamp('check_in_datetime');
            $table->timestamp('check_out_datetime'); // planned
            $table->timestamp('actual_check_out_datetime')->nullable();
            $table->decimal('late_checkout_fee', 12, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('check_in_datetime');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stays');
    }
};
