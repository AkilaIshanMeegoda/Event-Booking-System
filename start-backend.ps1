# Start all 7 backend microservices
# Run from: event-ticket-booking-platform\
# Usage: .\start-backend.ps1

$ROOT = Join-Path $PSScriptRoot "backend"

$services = @(
    @{ Name = "user-service";         Port = 5001 },
    @{ Name = "event-service";        Port = 5002 },
    @{ Name = "payment-service";      Port = 5003 },
    @{ Name = "booking-service";      Port = 5004 },
    @{ Name = "review-service";       Port = 5005 },
    @{ Name = "notification-service"; Port = 5006 },
    @{ Name = "reporting-service";    Port = 5007 }
)

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Event Ticket Booking - Backend" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

foreach ($svc in $services) {
    $svcPath = Join-Path $ROOT $svc.Name

    # Check if port already in use
    $inUse = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
    if ($inUse) {
        Write-Host "  [$($svc.Port)] $($svc.Name) already running - skipping" -ForegroundColor Yellow
        continue
    }

    # Spawn each service in its own terminal window (nodemon for auto-restart on crash)
    Start-Process powershell -ArgumentList "-NoExit", "-Command",
        "Set-Location '$svcPath'; `$host.UI.RawUI.WindowTitle = '$($svc.Name)'; npx nodemon src/server.js" `
        -WindowStyle Normal

    Write-Host "  [$($svc.Port)] Starting $($svc.Name)..." -ForegroundColor Green
    Start-Sleep -Milliseconds 400
}

Write-Host ""
Write-Host "All services launched. Waiting for startup..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Health check
Write-Host ""
Write-Host "--- Health Check ---" -ForegroundColor Cyan
foreach ($svc in $services) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:$($svc.Port)/health" -TimeoutSec 3
        Write-Host "  [$($svc.Port)] $($svc.Name) - OK" -ForegroundColor Green
    } catch {
        Write-Host "  [$($svc.Port)] $($svc.Name) - NOT READY (may still be starting)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Backend running on ports 5001-5007" -ForegroundColor Cyan
Write-Host "Now run: .\start-frontend.ps1" -ForegroundColor White
Write-Host ""
