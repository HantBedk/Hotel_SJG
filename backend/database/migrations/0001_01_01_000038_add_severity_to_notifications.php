<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('severity', 20)->default('info')->after('message');
            $table->boolean('is_modal')->default(false)->after('severity');
            $table->index('severity');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['severity']);
            $table->dropColumn(['severity', 'is_modal']);
        });
    }
};
