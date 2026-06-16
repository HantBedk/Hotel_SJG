<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stay_void_requests', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('hotel_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('stay_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('requested_by_id')->constrained('users')->restrictOnDelete();
            $table->string('reason', 500);
            $table->string('status', 20)->default('pending');
            $table->foreignUuid('reviewed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['hotel_id', 'status']);
            $table->index('stay_id');
        });

        DB::statement(
            "CREATE UNIQUE INDEX stay_void_requests_one_pending_per_stay
             ON stay_void_requests (stay_id)
             WHERE status = 'pending'",
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS stay_void_requests_one_pending_per_stay');
        Schema::dropIfExists('stay_void_requests');
    }
};
