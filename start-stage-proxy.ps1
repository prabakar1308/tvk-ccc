Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting Google Cloud SQL Auth Proxy (Staging)" -ForegroundColor Cyan
Write-Host "Listening on: 127.0.0.1:5433" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"
.\cloud-sql-proxy.exe tvk-command-centre-uat:asia-south1:tcc-postgres-staging --port 5433
