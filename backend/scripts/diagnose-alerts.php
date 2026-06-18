<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notification;
use App\Models\User;

$receptionists = User::role('receptionist')->where('is_active', true)->with('persona.roles.permissions', 'hotels')->get();

echo "Receptionists: {$receptionists->count()}\n";

foreach ($receptionists as $user) {
    echo "\n--- {$user->name} ({$user->id}) ---\n";
    echo 'Roles: ' . $user->getRoleNames()->implode(', ') . "\n";
    echo 'Perms: ' . $user->getAllPermissions()->pluck('name')->implode(', ') . "\n";
    echo 'Hotels: ' . $user->hotels->pluck('name')->implode(', ') . " | ids: " . $user->hotels->pluck('id')->implode(', ') . "\n";
    $unread = Notification::where('user_id', $user->id)->where('is_read', false)->count();
    echo "Unread notifications: {$unread}\n";
    Notification::where('user_id', $user->id)->where('is_read', false)->orderByDesc('created_at')->limit(3)->get()->each(function ($n) {
        $roomId = $n->payload['room_id'] ?? null;
        $hotelId = $n->payload['hotel_id'] ?? null;
        echo "  - [{$n->type}] {$n->title} | room_id={$roomId} | hotel_id={$hotelId} | is_read=" . json_encode($n->is_read) . "\n";
    });
}

$byPerm = User::permission('manage_reservations')->where('is_active', true)->count();
$byRole = User::role('receptionist')->where('is_active', true)->count();
echo "\nUsers with manage_reservations: {$byPerm}\n";
echo "Users with receptionist role: {$byRole}\n";

$roomId = '019ed5a7-f0d8-73c2-b783-7646982b88cb';
$room = \App\Models\Room::withoutGlobalScopes()->find($roomId);
if ($room) {
    echo "\nRoom {$room->number}: status={$room->status}, hotel_id={$room->hotel_id}\n";
}

$dorisId = '019ecc02-5038-710c-a685-d70a66ce7f74';
$paginator = \App\Models\Notification::where('user_id', $dorisId)
    ->orderByDesc('created_at')
    ->paginate(30);
echo "\nAPI paginator sample (first item is_read type): ";
$first = $paginator->items()[0] ?? null;
echo $first ? json_encode(['type' => $first->type, 'is_read' => $first->is_read]) : 'none';
echo "\nPaginator data count: " . count($paginator->items()) . "\n";

$hotelId = '019ecbfb-8117-71cb-b5d3-781934dc57b5';
$statusCounts = \App\Models\Room::withoutGlobalScopes()
    ->where('hotel_id', $hotelId)
    ->selectRaw('status, count(*) as c')
    ->groupBy('status')
    ->pluck('c', 'status');
echo "\nHOTEL ANI room statuses: " . json_encode($statusCounts) . "\n";
