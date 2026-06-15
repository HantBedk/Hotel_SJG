# Repara optionalDependencies de Linux faltantes en Windows (sin npm).
$ErrorActionPreference = 'Stop'
$frontend = Join-Path $PSScriptRoot '..\frontend'
Set-Location $frontend

$packages = @(
    @{ Scope = '@rollup'; Name = 'rollup-win32-x64-msvc'; Version = '4.60.4' },
    @{ Scope = '@esbuild'; Name = 'win32-x64'; Version = '0.25.12' },
    @{ Scope = ''; Name = 'lightningcss-win32-x64-msvc'; Version = '1.32.0' },
    @{ Scope = '@tailwindcss'; Name = 'oxide-win32-x64-msvc'; Version = '4.3.0' }
)

foreach ($pkg in $packages) {
    $folder = if ($pkg.Scope) { "$($pkg.Scope)/$($pkg.Name)" } else { $pkg.Name }
    $target = Join-Path 'node_modules' $folder
    $urlName = if ($pkg.Scope) { "$($pkg.Scope.TrimStart('@'))/$($pkg.Name)" } else { $pkg.Name }
    $url = "https://registry.npmjs.org/$urlName/-/$($pkg.Name)-$($pkg.Version).tgz"

    Write-Host "-> $folder"
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    $tgz = Join-Path $env:TEMP "pkg-$($pkg.Name).tgz"
    curl.exe -sL $url -o $tgz
    tar -xzf $tgz -C $target --strip-components=1
    Remove-Item $tgz -Force
}

Write-Host 'Binarios Windows instalados.'
