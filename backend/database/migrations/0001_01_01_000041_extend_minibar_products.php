<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('minibar_products', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->unique()->after('id');
            $table->string('presentation', 100)->nullable()->after('name');
            $table->integer('stock_quantity')->default(0)->after('damage_price');
            $table->date('expiration_date')->nullable()->after('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('minibar_products', function (Blueprint $table) {
            $table->dropColumn(['code', 'presentation', 'stock_quantity', 'expiration_date']);
        });
    }
};
