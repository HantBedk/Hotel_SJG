<?php
require '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $request = Illuminate\Http\Request::create('/api/v1/income/daily?preset=today', 'GET');
    $controller = new App\Http\Controllers\Api\V1\IncomeController();
    $response = $controller->daily($request);
    echo "OK: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . get_class($e) . "\n";
    echo "MSG:   " . $e->getMessage() . "\n";
    echo "FILE:  " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "TRACE (top 6):\n";
    foreach (array_slice($e->getTrace(), 0, 6) as $i => $t) {
        $loc = ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?');
        $fn  = ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? '?');
        echo "  #{$i} {$loc}  ->  {$fn}\n";
    }
}
