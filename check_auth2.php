<?php
require '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$req = Illuminate\Http\Request::create('http://localhost/api/v1/income/daily?preset=today', 'GET');
// No Accept header on purpose
$resp = $kernel->handle($req);
echo "status=" . $resp->getStatusCode() . "\n";
echo "content-type=" . $resp->headers->get('Content-Type') . "\n";
echo "body (first 400):\n";
echo substr($resp->getContent(), 0, 400) . "\n";
