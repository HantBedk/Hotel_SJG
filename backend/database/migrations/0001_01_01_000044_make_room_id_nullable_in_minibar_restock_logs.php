<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('minibar_restock_logs', function (Blueprint $table) {
            $table->uuid('room_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('minibar_restock_logs', function (Blueprint $table) {
            $table->uuid('room_id')->nullable(false)->change();
        });
    }
};
