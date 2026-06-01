<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_companions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('guest_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('document_type', 20)->nullable();
            $table->string('document_number', 50)->nullable();
            $table->string('relationship', 80)->nullable();
            $table->unsignedSmallInteger('age')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_companions');
    }
};
