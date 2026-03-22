# ==============================================================
# CTSE Event Ticket Platform - STOP ALL AWS RESOURCES ($0)
# Usage: .\stop-aws.ps1
# ==============================================================

$ErrorActionPreference = "Continue"
Write-Host "=== STOPPING ALL AWS RESOURCES ===" -ForegroundColor Red

# Step 1: Scale all ECS services to 0
Write-Host ""
Write-Host "[1/4] Scaling all services to 0 desired tasks..."
foreach ($svc in @("user-service","event-service","payment-service","booking-service","review-service","notification-service","reporting-service","frontend")) {
    $result = (aws ecs update-service --cluster ctse-ticket-cluster --service $svc --desired-count 0 --query "service.serviceName" --output text 2>$null)
    if ($result) { Write-Host "  -> scaled: $result" } else { Write-Host "  -> skipped (not found): $svc" }
}
Write-Host "Waiting 30s for tasks to drain..."
Start-Sleep 30

# Step 2: Delete all ECS services (--force handles any still-draining tasks)
Write-Host ""
Write-Host "[2/4] Deleting ECS services..."
foreach ($svc in @("user-service","event-service","payment-service","booking-service","review-service","notification-service","reporting-service","frontend")) {
    $result = (aws ecs delete-service --cluster ctse-ticket-cluster --service $svc --force --query "service.serviceName" --output text 2>$null)
    if ($result) { Write-Host "  -> deleted: $result" } else { Write-Host "  -> skipped (not found): $svc" }
}

# Wait for services to fully drain before deleting ALB/TGs
Write-Host "  Waiting for services to fully drain (max 120s)..."
$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    $draining = (aws ecs describe-services --cluster ctse-ticket-cluster `
        --services user-service event-service payment-service booking-service review-service notification-service reporting-service frontend `
        --query "services[?status=='DRAINING'].serviceName" --output text 2>$null)
    if (-not $draining) { break }
    Write-Host "  Still draining: $draining - waiting 15s..."
    Start-Sleep 15
}
Write-Host "  All services inactive."

# Step 3: Delete ALB
Write-Host ""
Write-Host "[3/4] Deleting ALB..."
$ALB_ARN = (aws elbv2 describe-load-balancers --names ctse-ticket-alb --query "LoadBalancers[0].LoadBalancerArn" --output text 2>$null)
if ($ALB_ARN -and $ALB_ARN -ne "None") {
    aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
    Write-Host "  -> ALB deleted. Waiting 30s for AWS to fully release it..."
    Start-Sleep 30
} else {
    Write-Host "  -> ALB not found, skipping"
}

# Step 4: Delete ctse target groups only (safe - will not touch other TGs in your account)
Write-Host ""
Write-Host "[4/5] Deleting target groups..."
$tgArns = (aws elbv2 describe-target-groups `
    --names ctse-user-service-tg ctse-event-service-tg ctse-payment-service-tg ctse-booking-service-tg `
            ctse-review-service-tg ctse-notification-svc-tg ctse-reporting-service-tg ctse-frontend-tg `
    --query "TargetGroups[*].TargetGroupArn" --output text 2>$null)
if ($tgArns) {
    foreach ($tg in ($tgArns.Split("`t") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
        aws elbv2 delete-target-group --target-group-arn $tg
        Write-Host "  -> deleted TG: $tg"
    }
} else {
    Write-Host "  -> No target groups found, skipping"
}

Write-Host ""
Write-Host "=== ALL STOPPED. Cost = $0 ===" -ForegroundColor Green
Write-Host "Kept free (no charge): VPC, Subnets, Security Groups, ECS Cluster, ECR Images, Task Definitions, CloudWatch Logs"

# Step 5: Delete API Gateway 'prod' stage (keep the API so URL stays stable on next start)
Write-Host ""
Write-Host "[5/5] Cleaning up API Gateway deployment..."
$API_ID = (aws apigateway get-rest-apis --query "items[?name=='ctse-ticket-api'].id" --output text 2>$null)
if ($API_ID -and $API_ID -ne "None") {
    aws apigateway delete-stage --rest-api-id $API_ID --stage-name prod 2>$null
    Write-Host "  -> Deleted 'prod' stage (API ID: $API_ID kept for stable URL)"
} else {
    Write-Host "  -> No API Gateway found, skipping"
}

Write-Host ""
Write-Host "=== CLEANUP COMPLETE ===" -ForegroundColor Green