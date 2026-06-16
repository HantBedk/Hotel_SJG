<?php

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';
$app = require $root . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Role;
use App\Models\User;
use App\Support\AuthUserPayload;
use App\Support\HotelAccess;
use Illuminate\Support\Facades\DB;

$email = $argv[1] ?? null;

echo "=== Staff hotel assignments ===\n";
User::query()
    ->with(['persona', 'hotels'])
    ->orderBy('email')
    ->each(function (User $user): void {
        $roles = $user->getRoleNames()->implode(', ') ?: '-';
        $hotelNames = $user->hotels->pluck('name')->implode(', ') ?: '(ninguno)';
        echo "  {$user->email} | {$roles} | {$hotelNames}\n";
    });

echo "\n=== Permissions in DB ===\n";
foreach (DB::table('permissions')->orderBy('name')->pluck('name') as $name) {
    echo "  - $name\n";
}

echo "\n=== Role permission gaps vs seeder ===\n";
$expected = [
    'admin' => [
        'view_dashboard', 'view_rooms', 'manage_rooms', 'view_reservations', 'manage_reservations',
        'check_in', 'check_out', 'request_stay_void', 'approve_stay_void', 'view_inventory',
        'manage_inventory', 'view_settings', 'manage_settings', 'view_activity_log', 'manage_users',
        'trigger_backup', 'restore_backup', 'view_reports', 'view_hotels',
    ],
    'receptionist' => [
        'view_dashboard', 'view_rooms', 'view_reservations', 'manage_reservations', 'check_in',
        'check_out', 'request_stay_void', 'view_inventory', 'view_activity_log',
    ],
];

foreach ($expected as $roleName => $perms) {
    $role = Role::where('name', $roleName)->first();
    if (! $role) {
        echo "$roleName: ROLE MISSING\n";
        continue;
    }
    $actual = $role->permissions->pluck('name')->sort()->values()->all();
    $missing = array_diff($perms, $actual);
    $extra = array_diff($actual, $perms);
    echo "$roleName missing: " . (empty($missing) ? 'none' : implode(', ', $missing)) . "\n";
    if (! empty($extra)) {
        echo "$roleName extra: " . implode(', ', $extra) . "\n";
    }
}

if (! $email) {
    echo "\n=== Usage ===\n";
    echo "  php scripts/diagnose-auth.php user@example.com\n";
    exit(0);
}

$user = User::where('email', $email)->with('persona', 'hotels')->first();
if (! $user) {
    echo "\nUsuario no encontrado: {$email}\n";
    exit(1);
}

echo "\n=== Auth payload for {$email} ===\n";
$payload = AuthUserPayload::build($user);
echo json_encode([
    'roles'            => $payload['roles'],
    'permissions'      => $payload['permissions'],
    'hotels'           => $payload['hotels'],
    'current_hotel_id' => $payload['current_hotel_id'],
    'can_switch_hotel' => $payload['can_switch_hotel'],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

echo "\n=== can() checks ===\n";
foreach (['view_dashboard', 'check_in', 'manage_reservations', 'manage_settings', 'view_reports'] as $perm) {
    echo "$perm: " . ($user->can($perm) ? 'yes' : 'no') . "\n";
}

echo "\n=== default hotel ===\n";
echo HotelAccess::defaultHotelId($user) ?? '(null)';

echo "\n";
