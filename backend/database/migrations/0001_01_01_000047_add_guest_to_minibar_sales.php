<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minibar_sales', function (Blueprint $table) {
            $table->foreignUuid('guest_id')
                ->nullable()
                ->after('customer_document')
                ->constrained('guests')
                ->nullOnDelete();
            $table->index('guest_id');
        });
    }

    public function down(): void
    {
        Schema::table('minibar_sales', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropIndex(['guest_id']);
            $table->dropColumn('guest_id');
        });
    }
};
