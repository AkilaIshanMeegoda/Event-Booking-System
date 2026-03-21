# Start all microservices locally with MongoDB Atlas
# Run from the event-ticket-booking-platform directory

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$MONGO_BASE = "mongodb+srv://ctse:ctse123@cluster0.afkbz0b.mongodb.net"
$JWT_SECRET = "ctse-super-secret-jwt-key-2026"
$SERVICE_KEY = "ctse-internal-service-key-2026"

$services = @(
    @{
        Name     = "user-service"
        Port     = 5001
        DB       = "user_db"
        Extra    = @{ JWT_EXPIRE = "24h" }
    },
    @{
        Name     = "event-service"
        Port     = 5002
        DB       = "event_db"
        Extra    = @{ USER_SERVICE_URL = "http://localhost:5001" }
    },
    @{
        Name     = "payment-service"
        Port     = 5003
        DB       = "payment_db"
        Extra    = @{
            BOOKING_SERVICE_URL      = "http://localhost:5004"
            NOTIFICATION_SERVICE_URL = "http://localhost:5006"
        }
    },
    @{
        Name     = "booking-service"
        Port     = 5004
        DB       = "booking_db"
        Extra    = @{
            USER_SERVICE_URL         = "http://localhost:5001"
            EVENT_SERVICE_URL        = "http://localhost:5002"
            PAYMENT_SERVICE_URL      = "http://localhost:5003"
            NOTIFICATION_SERVICE_URL = "http://localhost:5006"
        }
    },
    @{
        Name     = "review-service"
        Port     = 5005
        DB       = "review_db"
        Extra    = @{
            USER_SERVICE_URL         = "http://localhost:5001"
            EVENT_SERVICE_URL        = "http://localhost:5002"
            BOOKING_SERVICE_URL      = "http://localhost:5004"
            NOTIFICATION_SERVICE_URL = "http://localhost:5006"
        }
    },
    @{
        Name     = "notification-service"
        Port     = 5006
        DB       = "notification_db"
        Extra    = @{}
    },
    @{
        Name     = "reporting-service"
        Port     = 5007
        DB       = "reporting_db"
        Extra    = @{
            USER_SERVICE_URL    = "http://localhost:5001"
            EVENT_SERVICE_URL   = "http://localhost:5002"
            BOOKING_SERVICE_URL = "http://localhost:5004"
            PAYMENT_SERVICE_URL = "http://localhost:5003"
        }
    }
)

Write-Host "=== Installing dependencies for all services ===" -ForegroundColor Cyan
foreach ($svc in $services) {
    $svcPath = Join-Path $ROOT $svc.Name
    if (Test-Path (Join-Path $svcPath "package.json")) {
        Write-Host "Installing $($svc.Name)..." -ForegroundColor Yellow
        Push-Location $svcPath
        npm install --silent
        Pop-Location
    }
}

Write-Host "`n=== Starting all services ===" -ForegroundColor Cyan
foreach ($svc in $services) {
    $svcPath = Join-Path $ROOT $svc.Name
    $mongoUri = "$MONGO_BASE/$($svc.DB)?appName=Cluster0"

    # Build env vars string for the new process
    $envBlock = "PORT=$($svc.Port);MONGO_URI=$mongoUri;JWT_SECRET=$JWT_SECRET;SERVICE_KEY=$SERVICE_KEY;NODE_ENV=development;ALLOWED_ORIGINS=http://localhost:3000"
    foreach ($k in $svc.Extra.Keys) {
        $envBlock += ";$k=$($svc.Extra[$k])"
    }

    # Build the command to run in a new window
    $envSetCmds = ($envBlock -split ';' | ForEach-Object { "`$env:$_" }) -join "; "
    $cmd = "$envSetCmds; node src/server.js"

    Write-Host "Starting $($svc.Name) on port $($svc.Port)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$svcPath'; $cmd" -WindowStyle Normal
    Start-Sleep -Milliseconds 500
}

Write-Host "`n=== All services launched! ===" -ForegroundColor Cyan
Write-Host "Endpoints:" -ForegroundColor White
Write-Host "  User Service:         http://localhost:5001/health"
Write-Host "  Event Service:        http://localhost:5002/health"
Write-Host "  Payment Service:      http://localhost:5003/health"
Write-Host "  Booking Service:      http://localhost:5004/health"
Write-Host "  Review Service:       http://localhost:5005/health"
Write-Host "  Notification Service: http://localhost:5006/health"
Write-Host "  Reporting Service:    http://localhost:5007/health"
