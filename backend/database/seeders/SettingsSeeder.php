<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Hotel
            ['key' => 'hotel.iva_enabled',              'value' => 'true',  'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.iva_rate',                 'value' => '19',    'type' => 'integer', 'group' => 'hotel'],
            ['key' => 'hotel.check_out_time',           'value' => '13:00', 'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.check_in_time',            'value' => '14:00', 'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.currency',                 'value' => 'COP',   'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.country',                  'value' => 'Colombia', 'type' => 'string', 'group' => 'hotel'],
            ['key' => 'hotel.late_checkout_fee',        'value' => '50000', 'type' => 'integer', 'group' => 'hotel'],
            ['key' => 'hotel.reservations_enabled',     'value' => 'true',  'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.auto_assign_reservations', 'value' => 'false', 'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.reservation_alert_hours',  'value' => '24',    'type' => 'integer', 'group' => 'hotel'],
            ['key' => 'hotel.cleaning_alerts',          'value' => 'true',  'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.cleaning_hour',            'value' => '10:00', 'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.notify_cleaning_done',     'value' => 'true',  'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.admin_alert_hours',        'value' => '06:00,20:00', 'type' => 'string', 'group' => 'hotel'],
            ['key' => 'minibar.default_template',       'value' => '[]',    'type' => 'json',    'group' => 'minibar'],
            // System
            ['key' => 'system.date_format',             'value' => 'DD/MM/YYYY', 'type' => 'string', 'group' => 'system'],
            ['key' => 'system.time_format',             'value' => 'HH:mm',      'type' => 'string', 'group' => 'system'],
            // Inventario
            ['key' => 'inventory.expiry_alert_days',    'value' => '7',     'type' => 'integer', 'group' => 'inventory'],
            ['key' => 'inventory.low_stock_threshold',  'value' => '5',     'type' => 'integer', 'group' => 'inventory'],
            // Backup
            ['key' => 'backup.auto_backup',             'value' => 'true',  'type' => 'boolean', 'group' => 'backup'],
            ['key' => 'backup.auto_backup_time',        'value' => '23:59', 'type' => 'string',  'group' => 'backup'],
            ['key' => 'backup.auto_backup_folder',      'value' => '',      'type' => 'string',  'group' => 'backup'],
            ['key' => 'backup.retention_days',          'value' => '7',     'type' => 'integer', 'group' => 'backup'],
        ];

        foreach ($defaults as $s) {
            Setting::firstOrCreate(['key' => $s['key']], array_diff_key($s, ['key' => '']));
        }
    }
}
