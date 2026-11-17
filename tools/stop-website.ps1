# Stops the local website, API and database started by START WEBSITE.bat.
$Root = Split-Path -Parent $PSScriptRoot
foreach ($port in 3000, 4000) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
# Only this project's embedded PostgreSQL
Get-Process postgres -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "$Root\backend\node_modules\@embedded-postgres*" } |
  Stop-Process -Force -ErrorAction SilentlyContinue
# The service windows opened by the start script
Get-Process powershell -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowTitle -like "Plumbing - *" } |
  Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Stopped website, API and database." -ForegroundColor Green
Start-Sleep -Seconds 2
