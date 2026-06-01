<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_payments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('reservation_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 20); // cash, transfer, card
            $table->string('payment_type', 20);   // deposit, partial, final
            $table->foreignUuid('receptionist_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('payment_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('reservation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_payments');
    }
};
