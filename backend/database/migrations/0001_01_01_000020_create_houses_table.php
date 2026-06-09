<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('houses', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->decimal('price', 12, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->foreignUuid('house_id')
                ->nullable()
                ->constrained('houses')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\House::class);
            $table->dropColumn('house_id');
        });
        Schema::dropIfExists('houses');
    }
};
