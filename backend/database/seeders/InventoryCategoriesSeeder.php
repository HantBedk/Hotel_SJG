<?php

namespace Database\Seeders;

use App\Models\InventoryCategory;
use Illuminate\Database\Seeder;

class InventoryCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Consumibles', 'type' => 'consumable'],
            ['name' => 'Activos Fijos', 'type' => 'asset'],
            ['name' => 'Limpieza', 'type' => 'cleaning'],
            ['name' => 'Amenidades', 'type' => 'consumable'],
            ['name' => 'Alimentos y Bebidas', 'type' => 'consumable'],
        ];

        foreach ($categories as $cat) {
            InventoryCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
