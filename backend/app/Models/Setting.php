<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = ['key', 'value', 'type', 'group'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::find($key);
        if (!$setting) return $default;

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'json'    => json_decode($setting->value, true),
            default   => $setting->value,
        };
    }

    public static function set(string $key, mixed $value, string $type = 'string', string $group = 'general'): void
    {
        $stored = is_array($value) ? json_encode($value) : (string) $value;
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $stored, 'type' => $type, 'group' => $group]
        );
    }
}
