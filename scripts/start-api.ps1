$ErrorActionPreference = "Stop"

$php = $env:PHP_BINARY

if (-not $php) {
    $command = Get-Command php -ErrorAction SilentlyContinue
    if ($command) {
        $php = $command.Source
    }
}

if (-not $php -and (Test-Path "C:\wamp64\bin\php")) {
    $versions = Get-ChildItem "C:\wamp64\bin\php" -Directory |
        Where-Object { $_.Name -match '^php\d+\.\d+\.\d+$' } |
        Sort-Object { [version]($_.Name -replace '^php', '') } -Descending

    if ($versions) {
        $candidate = Join-Path $versions[0].FullName "php.exe"
        if (Test-Path $candidate) {
            $php = $candidate
        }
    }
}

if (-not $php -or -not (Test-Path $php)) {
    Write-Error "PHP introuvable. Installe PHP et ajoute-le au PATH, ou définis PHP_BINARY."
    exit 1
}

Write-Host "Utilisation de PHP : $php"
& $php -S 127.0.0.1:8001 -t .
