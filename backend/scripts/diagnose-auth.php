<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Role;
use App\Models\User;
use App\Support\AuthUserPayload;
use Illuminate\Support\Facades\DB;

echo "=== Permissions in DB ===\n";
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

echo "\n=== Auth payload JSON shape ===\n";
$user = User::where('email', 'dorismena2018@gmail.com')->with('persona', 'hotels')->first();
$payload = AuthUserPayload::build($user);
echo json_encode([
    'roles' => $payload['roles'],
    'permissions' => $payload['permissions'],
], JSON_PRETTY_PRINT) . "\n";

echo "\n=== can() checks receptionist ===\n";
foreach (['view_dashboard', 'check_in', 'manage_reservations', 'manage_settings', 'view_reports'] as $perm) {
    echo "$perm: " . ($user->can($perm) ? 'yes' : 'no') . "\n";
}
