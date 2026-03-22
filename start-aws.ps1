# ==============================================================
# CTSE Event Ticket Platform - START ALL AWS RESOURCES
# Usage: .\start-aws.ps1
# Idempotent: safe to re-run — reuses existing resources
# ==============================================================

$ErrorActionPreference = "Continue"
Write-Host "=== STARTING ALL AWS RESOURCES ===" -ForegroundColor Cyan

$VPC_ID   = "vpc-0a7a3d066a19734a0"
$SUBNET_A = "subnet-0b2a95c461d16355b"
$SUBNET_B = "subnet-0afb3448ecc28e503"
$ALB_SG   = "sg-0636ef67560ddd24a"
$ECS_SG   = "sg-08117cdeff00a7f7a"

# ---- Step 1: Create or reuse ALB ----
Write-Host ""
Write-Host "[1/8] Creating ALB..."
$ALB_ARN = (aws elbv2 describe-load-balancers --names ctse-ticket-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>$null)
if (-not $ALB_ARN -or $ALB_ARN -eq "None") {
    $ALB_ARN = (aws elbv2 create-load-balancer `
        --name ctse-ticket-alb `
        --subnets $SUBNET_A $SUBNET_B `
        --security-groups $ALB_SG `
        --scheme internet-facing `
        --type application `
        --query 'LoadBalancers[0].LoadBalancerArn' --output text)
    Write-Host "  Created ALB: $ALB_ARN"
} else {
    Write-Host "  ALB already exists: $ALB_ARN"
}

$ALB_DNS = (aws elbv2 describe-load-balancers `
    --load-balancer-arns $ALB_ARN `
    --query 'LoadBalancers[0].DNSName' --output text)
Write-Host "  ALB DNS: $ALB_DNS"

# ---- Step 2: Create or reuse Target Groups ----
Write-Host ""
Write-Host "[2/8] Creating target groups..."

function Get-OrCreateTG($name, $port, $healthPath) {
    $arn = (aws elbv2 describe-target-groups --names $name --query 'TargetGroups[0].TargetGroupArn' --output text 2>$null)
    if ($arn -and $arn -ne "None") {
        Write-Host "  $name exists: $arn"
        return $arn
    }
    $arn = (aws elbv2 create-target-group --name $name --protocol HTTP --port $port --vpc-id $VPC_ID --target-type ip --health-check-path $healthPath --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
    Write-Host "  $name created: $arn"
    return $arn
}

$TG_USER         = Get-OrCreateTG "ctse-user-service-tg"      5001 "/health"
$TG_EVENT        = Get-OrCreateTG "ctse-event-service-tg"     5002 "/health"
$TG_PAYMENT      = Get-OrCreateTG "ctse-payment-service-tg"   5003 "/health"
$TG_BOOKING      = Get-OrCreateTG "ctse-booking-service-tg"   5004 "/health"
$TG_REVIEW       = Get-OrCreateTG "ctse-review-service-tg"    5005 "/health"
$TG_NOTIFICATION = Get-OrCreateTG "ctse-notification-svc-tg"  5006 "/health"
$TG_REPORTING    = Get-OrCreateTG "ctse-reporting-service-tg" 5007 "/health"
$TG_FRONTEND     = Get-OrCreateTG "ctse-frontend-tg"          3000 "/"

# ---- Step 3: Create or reuse Listener (default to frontend) ----
Write-Host ""
Write-Host "[3/8] Creating listener..."
$LISTENER_ARN = (aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[0].ListenerArn' --output text 2>$null)
if (-not $LISTENER_ARN -or $LISTENER_ARN -eq "None") {
    $LISTENER_ARN = (aws elbv2 create-listener `
        --load-balancer-arn $ALB_ARN `
        --protocol HTTP --port 80 `
        --default-actions "Type=forward,TargetGroupArn=$TG_FRONTEND" `
        --query 'Listeners[0].ListenerArn' --output text)
    Write-Host "  Created listener: $LISTENER_ARN"
} else {
    Write-Host "  Listener already exists: $LISTENER_ARN"
}

# ---- Step 4: Create Routing Rules (skip if already present) ----
Write-Host ""
Write-Host "[4/8] Creating routing rules..."

# Get existing rule priorities
$existingPriorities = (aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query "Rules[*].Priority" --output text 2>$null)

function New-RuleIfMissing($priority, $condFile, $tgArn, $label) {
    if ($existingPriorities -match "\b$priority\b") {
        Write-Host "  -> rule $priority already exists: $label"
        return
    }
    aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority $priority --conditions "file://$condFile" --actions "Type=forward,TargetGroupArn=$tgArn" --output text >$null 2>$null
    Write-Host "  -> rule $priority : $label"
}

[System.IO.File]::WriteAllText("$env:TEMP\r10.json", '[{"Field":"path-pattern","Values":["/api/auth","/api/auth/*","/api/users","/api/users/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r20.json", '[{"Field":"path-pattern","Values":["/api/events","/api/events/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r30.json", '[{"Field":"path-pattern","Values":["/api/payments","/api/payments/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r40.json", '[{"Field":"path-pattern","Values":["/api/bookings","/api/bookings/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r50.json", '[{"Field":"path-pattern","Values":["/api/reviews","/api/reviews/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r60.json", '[{"Field":"path-pattern","Values":["/api/notifications","/api/notifications/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r70.json", '[{"Field":"path-pattern","Values":["/api/reports","/api/reports/*"]}]')

New-RuleIfMissing 10 "$env:TEMP/r10.json" $TG_USER         "/api/users + /api/auth -> user-service"
New-RuleIfMissing 20 "$env:TEMP/r20.json" $TG_EVENT        "/api/events -> event-service"
New-RuleIfMissing 30 "$env:TEMP/r30.json" $TG_PAYMENT      "/api/payments -> payment-service"
New-RuleIfMissing 40 "$env:TEMP/r40.json" $TG_BOOKING      "/api/bookings -> booking-service"
New-RuleIfMissing 50 "$env:TEMP/r50.json" $TG_REVIEW       "/api/reviews -> review-service"
New-RuleIfMissing 60 "$env:TEMP/r60.json" $TG_NOTIFICATION "/api/notifications -> notification-service"
New-RuleIfMissing 70 "$env:TEMP/r70.json" $TG_REPORTING    "/api/reports -> reporting-service"

# ---- Step 5: Create / Update API Gateway REST API ----
Write-Host ""
Write-Host "[5/8] Setting up API Gateway REST API..."

# Check if the API already exists
$API_ID = (aws apigateway get-rest-apis --query "items[?name=='ctse-ticket-api'].id" --output text 2>$null)
if (-not $API_ID -or $API_ID -eq "None") {
    $API_ID = (aws apigateway create-rest-api `
        --name ctse-ticket-api `
        --description "CTSE Event Ticket Platform API Gateway" `
        --endpoint-configuration "types=REGIONAL" `
        --query 'id' --output text)
    Write-Host "  Created API Gateway: $API_ID"
} else {
    Write-Host "  API Gateway already exists: $API_ID"
}

# Get the root resource id (/)
$ROOT_ID = (aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text)
Write-Host "  Root resource: $ROOT_ID"

# Create /{proxy+} catch-all resource
$PROXY_EXISTS = (aws apigateway get-resources --rest-api-id $API_ID --query "items[?pathPart=='{proxy+}'].id" --output text 2>$null)
if (-not $PROXY_EXISTS -or $PROXY_EXISTS -eq "None") {
    $PROXY_ID = (aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $ROOT_ID `
        --path-part '{proxy+}' `
        --query 'id' --output text)
    Write-Host "  Created {proxy+} resource: $PROXY_ID"
} else {
    $PROXY_ID = $PROXY_EXISTS
    Write-Host "  {proxy+} resource exists: $PROXY_ID"
}

# Set up ANY method + HTTP_PROXY integration on /{proxy+}
# put-method may return ConflictException if method already exists — that's fine
$null = aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $PROXY_ID `
    --http-method ANY `
    --authorization-type NONE `
    --request-parameters "method.request.path.proxy=true" `
    --output text 2>&1
Write-Host "  -> ANY method on /{proxy+}"

$null = aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $PROXY_ID `
    --http-method ANY `
    --type HTTP_PROXY `
    --integration-http-method ANY `
    --uri "http://$ALB_DNS/{proxy}" `
    --request-parameters "integration.request.path.proxy=method.request.path.proxy" `
    --output text 2>&1
Write-Host "  -> HTTP_PROXY integration -> http://$ALB_DNS/{proxy}"

# Set up ANY method + HTTP_PROXY integration on root (/) for frontend
$null = aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $ROOT_ID `
    --http-method ANY `
    --authorization-type NONE `
    --output text 2>&1

$null = aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $ROOT_ID `
    --http-method ANY `
    --type HTTP_PROXY `
    --integration-http-method ANY `
    --uri "http://$ALB_DNS/" `
    --output text 2>&1
Write-Host "  -> Root (/) -> http://$ALB_DNS/"

# Deploy to 'prod' stage
$null = aws apigateway create-deployment `
    --rest-api-id $API_ID `
    --stage-name prod `
    --description "Auto-deployed by start-aws.ps1" `
    --output text 2>&1
Write-Host "  -> Deployed to 'prod' stage"

$API_GW_URL = "https://$API_ID.execute-api.ap-south-1.amazonaws.com/prod"
Write-Host "  API Gateway URL: $API_GW_URL" -ForegroundColor Yellow

# ---- Step 6: Update frontend task definition with API Gateway URL ----
Write-Host ""
Write-Host "[6/8] Updating frontend task definition with API Gateway URL..."
Set-Location "G:\Sliit\Project\Event-Booking-System"
$content = Get-Content "backend\task-definitions\frontend.json" -Raw
# Replace any previous ALB or API GW URL with the new API Gateway URL
$content = $content -replace 'http://ctse-ticket-alb-\d+\.ap-south-1\.elb\.amazonaws\.com', $API_GW_URL
$content = $content -replace 'https://[a-z0-9]+\.execute-api\.ap-south-1\.amazonaws\.com/prod', $API_GW_URL
[System.IO.File]::WriteAllText("$PWD\backend\task-definitions\frontend.json", $content)
$taskDefArn = (aws ecs register-task-definition --region ap-south-1 --cli-input-json "file://backend/task-definitions/frontend.json" --query "taskDefinition.taskDefinitionArn" --output text)
Write-Host "  Registered: $taskDefArn"

# ---- Step 7: Update backend task definitions with ALB DNS for inter-service calls ----
Write-Host ""
Write-Host "[7/8] Updating backend task definitions with ALB DNS for inter-service calls..."
$backendTasks = @("user-service","event-service","payment-service","booking-service","review-service","notification-service","reporting-service")
foreach ($svc in $backendTasks) {
    $taskFile = "backend\task-definitions\$svc.json"
    if (Test-Path $taskFile) {
        $taskContent = Get-Content $taskFile -Raw
        $taskContent = $taskContent -replace 'http://ctse-ticket-alb-\d+\.ap-south-1\.elb\.amazonaws\.com', "http://$ALB_DNS"
        [System.IO.File]::WriteAllText("$PWD\$taskFile", $taskContent)
        $tdArn = (aws ecs register-task-definition --region ap-south-1 --cli-input-json "file://$taskFile" --query "taskDefinition.taskDefinitionArn" --output text)
        Write-Host "  -> $svc registered: $tdArn"
    }
}

# ---- Step 8: Create ECS Services ----
Write-Host ""
Write-Host "[8/8] Creating ECS services..."

# Safety: wait for any old service instances to fully drain (relevant if stop+start run back-to-back)
Write-Host "  Checking for services still draining from a previous stop..."
$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    $draining = (aws ecs describe-services --cluster ctse-ticket-cluster `
        --services user-service event-service payment-service booking-service review-service notification-service reporting-service frontend `
        --query "services[?status=='DRAINING'].serviceName" --output text 2>$null)
    if (-not $draining) { break }
    Write-Host "  Services still draining: $draining - waiting 15s..."
    Start-Sleep 15
}
Write-Host "  Cleared. Creating services..."

$netConfig = "awsvpcConfiguration={subnets=[$SUBNET_A,$SUBNET_B],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}"

$services = @(
    @{name="user-service";         td="ctse-ticket-user-service";         tg=$TG_USER;         port=5001},
    @{name="event-service";        td="ctse-ticket-event-service";        tg=$TG_EVENT;        port=5002},
    @{name="payment-service";      td="ctse-ticket-payment-service";      tg=$TG_PAYMENT;      port=5003},
    @{name="booking-service";      td="ctse-ticket-booking-service";      tg=$TG_BOOKING;      port=5004},
    @{name="review-service";       td="ctse-ticket-review-service";       tg=$TG_REVIEW;       port=5005},
    @{name="notification-service"; td="ctse-ticket-notification-service"; tg=$TG_NOTIFICATION; port=5006},
    @{name="reporting-service";    td="ctse-ticket-reporting-service";    tg=$TG_REPORTING;    port=5007},
    @{name="frontend";             td="ctse-ticket-frontend";             tg=$TG_FRONTEND;     port=3000}
)

foreach ($s in $services) {
    # Check if service already exists and is ACTIVE
    $svcStatus = (aws ecs describe-services --cluster ctse-ticket-cluster --services $s.name --query "services[0].status" --output text 2>$null)
    if ($svcStatus -eq "ACTIVE") {
        # Service exists — update it with latest task definition
        $null = aws ecs update-service `
            --cluster ctse-ticket-cluster `
            --service $s.name `
            --task-definition $s.td `
            --desired-count 1 `
            --force-new-deployment `
            --query "service.serviceName" --output text 2>&1
        Write-Host "  -> updated: $($s.name) (was already ACTIVE)"
    } else {
        # Service is INACTIVE or doesn't exist — create it
        $svcName = (aws ecs create-service `
            --cluster ctse-ticket-cluster `
            --service-name $s.name `
            --task-definition $s.td `
            --desired-count 1 `
            --launch-type FARGATE `
            --network-configuration $netConfig `
            --load-balancers "targetGroupArn=$($s.tg),containerName=$($s.name),containerPort=$($s.port)" `
            --query "service.serviceName" --output text 2>&1)
        Write-Host "  -> created: $svcName"
    }
}

# ---- Final Status Check ----
Write-Host ""
Write-Host "=== ALL STARTED ===" -ForegroundColor Green
Write-Host "API Gateway URL: $API_GW_URL" -ForegroundColor Yellow
Write-Host "ALB URL (internal): http://$ALB_DNS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting 90s then checking service health..."
Start-Sleep 90
aws ecs describe-services --cluster ctse-ticket-cluster `
    --services user-service event-service payment-service booking-service review-service notification-service reporting-service frontend `
    --query "services[*].[serviceName,runningCount,desiredCount,status]" --output table