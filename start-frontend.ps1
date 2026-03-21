# Start the Next.js frontend
# Run from: event-ticket-booking-platform\
# Usage: .\start-frontend.ps1

$FRONTEND = Join-Path $PSScriptRoot "frontend"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Event Ticket Booking - Frontend" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if port already in use
$inUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($inUse) {
    Write-Host "  Frontend already running on port 3000" -ForegroundColor Yellow
    Write-Host "  Open: http://localhost:3000" -ForegroundColor Green
    exit 0
}

Write-Host "  Starting Next.js on http://localhost:3000..." -ForegroundColor Green
Write-Host ""

Set-Location $FRONTEND
npm run dev
