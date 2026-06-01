<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::create('guests', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('full_name');
            $table->string('document_type', 20); // cc, ce, passport
            $table->string('document_number', 50)->unique();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('nationality', 80)->nullable();
            $table->date('birth_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_number');
        });

        // Trigram index for fuzzy search on name and phone
        DB::statement('CREATE INDEX guests_full_name_trgm ON guests USING GIN (full_name gin_trgm_ops)');
        DB::statement('CREATE INDEX guests_phone_trgm ON guests USING GIN (phone gin_trgm_ops)');
    }

    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
