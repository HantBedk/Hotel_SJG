<?php
require '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = App\Models\MinibarProduct::with('inventoryItem')
    ->withSum('roomMinibars as room_minibar_total', 'quantity')
    ->where('name', 'ilike', '%coca%')
    ->first();

if (!$p) { echo "NO COCACOLA\n"; exit; }

echo "name={$p->name}\n";
echo "stock_quantity={$p->stock_quantity}\n";
echo "inventory_item_id=" . ($p->inventory_item_id ?? 'NULL') . "\n";
echo "inventory_item.current_stock=" . ($p->inventoryItem?->current_stock ?? 'NULL') . "\n";
echo "room_minibar_total={$p->room_minibar_total}\n";
$cs = $p->inventoryItem ? (int)$p->inventoryItem->current_stock : (int)$p->stock_quantity;
echo "TOTAL_STOCK=" . ($cs + (int)$p->room_minibar_total) . "\n";

echo "\n-- RoomMinibar de cocacola por habitacion --\n";
$rm = App\Models\RoomMinibar::with('room:id,number')
    ->where('minibar_product_id', $p->id)
    ->get();
if ($rm->isEmpty()) echo "  (vacio)\n";
foreach ($rm as $r) echo "  Hab {$r->room?->number}: qty={$r->quantity}\n";

echo "\n-- Ultimos 5 consumos de cocacola --\n";
$c = App\Models\MinibarConsumption::with('room:id,number')
    ->where('product_name', 'ilike', '%coca%')
    ->orderByDesc('registered_at')->limit(5)->get();
if ($c->isEmpty()) echo "  (sin consumos)\n";
foreach ($c as $cc) echo "  {$cc->registered_at} | hab={$cc->room?->number} | type={$cc->type} | qty={$cc->quantity}\n";
