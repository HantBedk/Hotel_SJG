<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'hotel.iva_enabled',      'value' => 'true',  'type' => 'boolean', 'group' => 'hotel'],
            ['key' => 'hotel.iva_rate',          'value' => '19',    'type' => 'integer', 'group' => 'hotel'],
            ['key' => 'hotel.check_out_time',    'value' => '13:00', 'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.check_in_time',     'value' => '14:00', 'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.currency',          'value' => 'COP',   'type' => 'string',  'group' => 'hotel'],
            ['key' => 'hotel.country',           'value' => 'Colombia', 'type' => 'string', 'group' => 'hotel'],
            ['key' => 'hotel.late_checkout_fee', 'value' => '50000', 'type' => 'integer', 'group' => 'hotel'],
            ['key' => 'system.date_format',      'value' => 'DD/MM/YYYY', 'type' => 'string', 'group' => 'system'],
            ['key' => 'system.time_format',      'value' => 'HH:mm',      'type' => 'string', 'group' => 'system'],
            ['key' => 'backup.auto_backup',      'value' => 'true',  'type' => 'boolean', 'group' => 'backup'],
            ['key' => 'backup.retention_days',   'value' => '30',    'type' => 'integer', 'group' => 'backup'],
        ];

        foreach ($defaults as $s) {
            Setting::firstOrCreate(['key' => $s['key']], array_diff_key($s, ['key' => '']));
        }
    }
}
