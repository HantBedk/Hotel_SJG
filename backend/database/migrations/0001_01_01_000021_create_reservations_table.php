<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('guest_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignUuid('house_id')->nullable()->constrained('houses')->nullOnDelete();
            $table->string('status', 20)->default('pending'); // pending, confirmed, checked_in, cancelled, no_show
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('nights');
            $table->decimal('agreed_price', 12, 2);
            $table->decimal('deposit_amount', 12, 2)->nullable();
            $table->string('payment_status', 20)->default('pending'); // pending, partial, paid
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index(['start_date', 'end_date']);
            $table->index('guest_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
