# ==============================================================
# CTSE Event Ticket Platform - START ALL AWS RESOURCES
# Usage: .\start-aws.ps1
# ==============================================================

$ErrorActionPreference = "Stop"
Write-Host "=== STARTING ALL AWS RESOURCES ===" -ForegroundColor Cyan

$VPC_ID   = "vpc-0a7a3d066a19734a0"
$SUBNET_A = "subnet-0b2a95c461d16355b"
$SUBNET_B = "subnet-0afb3448ecc28e503"
$ALB_SG   = "sg-0636ef67560ddd24a"
$ECS_SG   = "sg-08117cdeff00a7f7a"

# ---- Step 1: Create ALB ----
Write-Host ""
Write-Host "[1/6] Creating ALB..."
$ALB_ARN = (aws elbv2 create-load-balancer `
    --name ctse-ticket-alb `
    --subnets $SUBNET_A $SUBNET_B `
    --security-groups $ALB_SG `
    --scheme internet-facing `
    --type application `
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)
Write-Host "  ALB ARN: $ALB_ARN"

$ALB_DNS = (aws elbv2 describe-load-balancers `
    --load-balancer-arns $ALB_ARN `
    --query 'LoadBalancers[0].DNSName' --output text)
Write-Host "  ALB DNS: $ALB_DNS"

# ---- Step 2: Create Target Groups ----
Write-Host ""
Write-Host "[2/6] Creating target groups..."
$TG_USER = (aws elbv2 create-target-group --name ctse-user-service-tg --protocol HTTP --port 5001 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_USER: $TG_USER"
$TG_EVENT = (aws elbv2 create-target-group --name ctse-event-service-tg --protocol HTTP --port 5002 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_EVENT: $TG_EVENT"
$TG_PAYMENT = (aws elbv2 create-target-group --name ctse-payment-service-tg --protocol HTTP --port 5003 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_PAYMENT: $TG_PAYMENT"
$TG_BOOKING = (aws elbv2 create-target-group --name ctse-booking-service-tg --protocol HTTP --port 5004 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_BOOKING: $TG_BOOKING"
$TG_REVIEW = (aws elbv2 create-target-group --name ctse-review-service-tg --protocol HTTP --port 5005 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_REVIEW: $TG_REVIEW"
$TG_NOTIFICATION = (aws elbv2 create-target-group --name ctse-notification-svc-tg --protocol HTTP --port 5006 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_NOTIFICATION: $TG_NOTIFICATION"
$TG_REPORTING = (aws elbv2 create-target-group --name ctse-reporting-service-tg --protocol HTTP --port 5007 --vpc-id $VPC_ID --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_REPORTING: $TG_REPORTING"
$TG_FRONTEND = (aws elbv2 create-target-group --name ctse-frontend-tg --protocol HTTP --port 3000 --vpc-id $VPC_ID --target-type ip --health-check-path / --health-check-interval-seconds 30 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --query 'TargetGroups[0].TargetGroupArn' --output text)
Write-Host "  TG_FRONTEND: $TG_FRONTEND"

# ---- Step 3: Create Listener (default to frontend) ----
Write-Host ""
Write-Host "[3/6] Creating listener..."
$LISTENER_ARN = (aws elbv2 create-listener `
    --load-balancer-arn $ALB_ARN `
    --protocol HTTP --port 80 `
    --default-actions "Type=forward,TargetGroupArn=$TG_FRONTEND" `
    --query 'Listeners[0].ListenerArn' --output text)
Write-Host "  Listener: $LISTENER_ARN"

# ---- Step 4: Create Routing Rules ----
Write-Host ""
Write-Host "[4/6] Creating routing rules..."
[System.IO.File]::WriteAllText("$env:TEMP\r10.json", '[{"Field":"path-pattern","Values":["/api/auth","/api/auth/*","/api/users","/api/users/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r20.json", '[{"Field":"path-pattern","Values":["/api/events","/api/events/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r30.json", '[{"Field":"path-pattern","Values":["/api/payments","/api/payments/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r40.json", '[{"Field":"path-pattern","Values":["/api/bookings","/api/bookings/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r50.json", '[{"Field":"path-pattern","Values":["/api/reviews","/api/reviews/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r60.json", '[{"Field":"path-pattern","Values":["/api/notifications","/api/notifications/*"]}]')
[System.IO.File]::WriteAllText("$env:TEMP\r70.json", '[{"Field":"path-pattern","Values":["/api/reports","/api/reports/*"]}]')

aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 10 --conditions "file://$env:TEMP/r10.json" --actions "Type=forward,TargetGroupArn=$TG_USER"         --output text >$null ; Write-Host "  -> rule 10: /api/users + /api/auth -> user-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 20 --conditions "file://$env:TEMP/r20.json" --actions "Type=forward,TargetGroupArn=$TG_EVENT"        --output text >$null ; Write-Host "  -> rule 20: /api/events -> event-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 30 --conditions "file://$env:TEMP/r30.json" --actions "Type=forward,TargetGroupArn=$TG_PAYMENT"      --output text >$null ; Write-Host "  -> rule 30: /api/payments -> payment-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 40 --conditions "file://$env:TEMP/r40.json" --actions "Type=forward,TargetGroupArn=$TG_BOOKING"      --output text >$null ; Write-Host "  -> rule 40: /api/bookings -> booking-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 50 --conditions "file://$env:TEMP/r50.json" --actions "Type=forward,TargetGroupArn=$TG_REVIEW"       --output text >$null ; Write-Host "  -> rule 50: /api/reviews -> review-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 60 --conditions "file://$env:TEMP/r60.json" --actions "Type=forward,TargetGroupArn=$TG_NOTIFICATION" --output text >$null ; Write-Host "  -> rule 60: /api/notifications -> notification-service"
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 70 --conditions "file://$env:TEMP/r70.json" --actions "Type=forward,TargetGroupArn=$TG_REPORTING"    --output text >$null ; Write-Host "  -> rule 70: /api/reports -> reporting-service"

# ---- Step 5: Update frontend task definition with new ALB DNS ----
Write-Host ""
Write-Host "[5/6] Updating frontend task definition with new ALB DNS..."
Set-Location "D:\Projects\CTSE-Event-Test"
$content = Get-Content "backend\task-definitions\frontend.json" -Raw
$content = $content -replace 'http://ctse-ticket-alb-\d+\.ap-south-1\.elb\.amazonaws\.com', "http://$ALB_DNS"
[System.IO.File]::WriteAllText("$PWD\backend\task-definitions\frontend.json", $content)
$taskDefArn = (aws ecs register-task-definition --region ap-south-1 --cli-input-json "file://backend/task-definitions/frontend.json" --query "taskDefinition.taskDefinitionArn" --output text)
Write-Host "  Registered: $taskDefArn"

# ---- Step 6: Create ECS Services ----
Write-Host ""
Write-Host "[6/6] Creating ECS services..."

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
    $svcName = (aws ecs create-service `
        --cluster ctse-ticket-cluster `
        --service-name $s.name `
        --task-definition $s.td `
        --desired-count 1 `
        --launch-type FARGATE `
        --network-configuration $netConfig `
        --load-balancers "targetGroupArn=$($s.tg),containerName=$($s.name),containerPort=$($s.port)" `
        --query "service.serviceName" --output text)
    Write-Host "  -> created: $svcName"
}

# ---- Final Status Check ----
Write-Host ""
Write-Host "=== ALL STARTED ===" -ForegroundColor Green
Write-Host "Website URL: http://$ALB_DNS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting 90s then checking service health..."
Start-Sleep 90
aws ecs describe-services --cluster ctse-ticket-cluster `
    --services user-service event-service payment-service booking-service review-service notification-service reporting-service frontend `
    --query "services[*].[serviceName,runningCount,desiredCount,status]" --output table