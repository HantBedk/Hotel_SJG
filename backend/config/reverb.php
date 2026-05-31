<?php

return [
    'default' => env('REVERB_SERVER', 'reverb'),

    'servers' => [
        'reverb' => [
            'host'     => env('REVERB_HOST', '0.0.0.0'),
            'port'     => env('REVERB_PORT', 8080),
            'hostname' => env('REVERB_HOST', '0.0.0.0'),
            'options'  => [
                'tls' => [],
            ],
            'max_request_size'      => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            'scaling'               => [
                'enabled' => false,
            ],
            'pulse_ingest_interval' => 15,
        ],
    ],

    'apps' => [
        'provider' => 'config',
        'apps'     => [
            [
                'key'                    => env('REVERB_APP_KEY', 'hotel_reverb_key'),
                'secret'                 => env('REVERB_APP_SECRET', 'changeme_reverb_secret'),
                'app_id'                 => env('REVERB_APP_ID', 'hotel_sjg'),
                'options'                => [
                    'host'      => env('REVERB_HOST', 'localhost'),
                    'port'      => env('REVERB_PORT', 8080),
                    'scheme'    => env('REVERB_SCHEME', 'http'),
                    'use_tls'   => env('REVERB_SCHEME', 'http') === 'https',
                ],
                'allowed_origins'        => ['*'],
                'ping_interval'          => env('REVERB_APP_PING_INTERVAL', 60),
                'activity_timeout'       => env('REVERB_APP_ACTIVITY_TIMEOUT', 30),
                'max_message_size'       => env('REVERB_APP_MAX_MESSAGE_SIZE', 10_000),
            ],
        ],
    ],
];
