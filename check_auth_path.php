<?php
require '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$req = Illuminate\Http\Request::create('http://localhost/api/v1/income/daily?preset=today', 'GET');
echo "path()=" . $req->path() . "\n";
echo "is('api/*') => " . ($req->is('api/*') ? 'TRUE' : 'FALSE') . "\n";
echo "expectsJson() (no Accept) => " . ($req->expectsJson() ? 'TRUE' : 'FALSE') . "\n";

$req2 = Illuminate\Http\Request::create('http://localhost/api/v1/income/daily?preset=today', 'GET');
$req2->headers->set('Accept', 'application/json');
echo "expectsJson() (with json Accept) => " . ($req2->expectsJson() ? 'TRUE' : 'FALSE') . "\n";

// Simular el escenario real: lanzar AuthenticationException sin Accept
try {
    throw new Illuminate\Auth\AuthenticationException();
} catch (\Throwable $e) {
    $handler = $app->make(Illuminate\Contracts\Debug\ExceptionHandler::class);
    $resp = $handler->render($req, $e);
    echo "\nResponse w/o Accept: status=" . $resp->getStatusCode() . " ct=" . $resp->headers->get('Content-Type') . "\n";
    echo "Body (first 200): " . substr($resp->getContent(), 0, 200) . "\n";
}
