# Hotel Manager — Docker local (Windows / PowerShell)
# Uso:
#   scripts\docker-local.ps1          # stack completo (app + db + reverb) en :8080
#   scripts\docker-local.ps1 dev      # + Vite hot reload en :3007
#   scripts\docker-local.ps1 down
#   scripts\docker-local.ps1 logs
#   scripts\docker-local.ps1 reset    # down -v (borra BD)

param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'dev', 'down', 'logs', 'reset', 'status')]
    [string]$Action = 'up'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$ComposeBase = @('-f', 'docker-compose.yml', '-f', 'docker/compose/docker-compose.local.yml')
$ComposeDev  = $ComposeBase + @('-f', 'docker/compose/docker-compose.dev.yml')

function Test-DockerRunning {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[ERROR] Docker no esta corriendo. Abre Docker Desktop e intenta de nuevo.' -ForegroundColor Red
        exit 1
    }
}

function Ensure-EnvFile {
    if (-not (Test-Path '.env')) {
        Copy-Item '.env.example' '.env'
        Write-Host '[OK] .env creado desde .env.example'
    }
    $envContent = Get-Content '.env' -Raw
    if ($envContent -notmatch '(?m)^HTTP_PORT=') {
        Add-Content '.env' "`nHTTP_PORT=8080"
    }
    if ($envContent -notmatch '(?m)^APP_URL=') {
        Add-Content '.env' 'APP_URL=http://localhost:8080'
    }
}

function Ensure-BackupDir {
    $backupPath = './backup'
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
        Write-Host '[OK] Carpeta backup/ creada'
    }
}

function Show-Info {
    $httpPort = (Select-String -Path '.env' -Pattern '^HTTP_PORT=(.+)$' -ErrorAction SilentlyContinue).Matches.Groups[1].Value
    if (-not $httpPort) { $httpPort = '8080' }

    Write-Host ''
    Write-Host '=== Hotel Manager (Docker local) ===' -ForegroundColor Cyan
    Write-Host "App:     http://localhost:$httpPort"
    Write-Host 'Login:   superadmin@hotelsjg.com / Hotel2024!'
    Write-Host ''
    Write-Host 'Comandos:'
    Write-Host '  scripts\docker-local.cmd logs'
    Write-Host '  scripts\docker-local.cmd down'
    Write-Host '  scripts\docker-local.cmd dev    (Vite :3007 con hot reload)'
    Write-Host ''
}

Test-DockerRunning

switch ($Action) {
    'up' {
        Ensure-EnvFile
        Ensure-BackupDir
        Write-Host '[1/2] Construyendo e iniciando contenedores (puerto 8080)...' -ForegroundColor Yellow
        docker compose @ComposeBase up -d --build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Host '[2/2] Esperando base de datos...'
        Start-Sleep -Seconds 12
        Show-Info
    }
    'dev' {
        Ensure-EnvFile
        Ensure-BackupDir
        Write-Host 'Iniciando stack + Vite dev (:3007)...' -ForegroundColor Yellow
        docker compose @ComposeDev up -d --build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Start-Sleep -Seconds 15
        Write-Host ''
        Write-Host 'Frontend dev: http://localhost:3007' -ForegroundColor Green
        Show-Info
    }
    'down' {
        docker compose @ComposeDev down 2>$null
        docker compose @ComposeBase down
    }
    'logs' {
        docker compose @ComposeBase logs -f --tail=100
    }
    'reset' {
        Write-Host 'AVISO: esto borra la base de datos (volumen postgres_data).' -ForegroundColor Red
        docker compose @ComposeDev down -v 2>$null
        docker compose @ComposeBase down -v
        Remove-Item -Force -ErrorAction SilentlyContinue backend/storage/.seeded
    }
    'status' {
        docker compose @ComposeBase ps
    }
}
