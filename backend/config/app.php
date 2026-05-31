<?php

return [
    'name'     => env('APP_NAME', 'Hotel Manager'),
    'env'      => env('APP_ENV', 'production'),
    'debug'    => (bool) env('APP_DEBUG', false),
    'url'      => env('APP_URL', 'http://localhost'),
    'timezone' => 'America/Bogota',
    'locale'   => 'es',
    'fallback_locale' => 'es',
    'faker_locale'    => 'es_CO',
    'cipher'   => 'AES-256-CBC',
    'key'      => env('APP_KEY'),
    'previous_keys' => [],
    'maintenance' => [
        'driver' => 'file',
    ],
    // Only app-level providers — third-party are auto-discovered via composer
    'providers' => [
        App\Providers\AppServiceProvider::class,
    ],
];
