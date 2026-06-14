<?php
require '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $request = Illuminate\Http\Request::create('/api/v1/income/report?preset=today', 'GET');
    $controller = new App\Http\Controllers\Api\V1\IncomeController();
    $response = $controller->report($request);
    echo "OK status=" . $response->getStatusCode() . " ct=" . $response->headers->get('Content-Type') . "\n";
    echo "len=" . strlen($response->getContent()) . " preview=" . substr($response->getContent(), 0, 200) . "\n";
} catch (\Throwable $e) {
    echo "ERROR " . get_class($e) . "\n";
    echo "MSG   " . $e->getMessage() . "\n";
    echo "AT    " . $e->getFile() . ':' . $e->getLine() . "\n";
    foreach (array_slice($e->getTrace(), 0, 10) as $i => $t) {
        $loc = ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?');
        $fn  = ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? '?');
        echo "  #{$i} {$loc}  ->  {$fn}\n";
    }
}
