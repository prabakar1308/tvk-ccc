$ErrorActionPreference = "Stop"

$ProjectId = "tvk-command-centre-uat"
$Region = "asia-south1"
$ServiceName = "tcc-backend-staging"
$JobName = "tcc-migrate-staging"

Write-Host "Starting Staging Database Migration via Cloud Run Job..." -ForegroundColor Cyan

# 1. Fetch DATABASE_URL from .env.staging
$DbUrl = ""
if (Test-Path "backend/.env.staging") {
    $envContent = Get-Content "backend/.env.staging"
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_URL=`"?(.*?)`"?$") {
            $DbUrl = $matches[1]
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Write-Host "Error: Could not find DATABASE_URL in backend/.env.staging." -ForegroundColor Red
    Write-Host "Please ensure it is set and try again." -ForegroundColor Red
    exit 1
}

# Extract Cloud SQL Instance connection name if using /cloudsql/
$CloudSqlInstance = "tvk-command-centre-uat:asia-south1:tcc-postgres-staging"
if ($DbUrl -match "/cloudsql/([^/?]+)") {
    $CloudSqlInstance = $matches[1]
}

# 2. Get the currently deployed Backend Image
Write-Host "`nFetching the currently deployed backend image..." -ForegroundColor Yellow
$Image = (gcloud run services describe $ServiceName --region $Region --project $ProjectId --format="value(image.url)")

if (-not $Image) {
    Write-Host "Error: Could not determine the deployed image for $ServiceName." -ForegroundColor Red
    exit 1
}
Write-Host "Using Image: $Image" -ForegroundColor Gray

# 3. Create or Update the Cloud Run Job
Write-Host "`nConfiguring Cloud Run Job ($JobName)..." -ForegroundColor Yellow

# We use 'update' but if it doesn't exist, we fall back to 'create'
$jobExists = (gcloud run jobs list --region $Region --project $ProjectId --format="value(name)" --filter="name:$JobName")
if ($jobExists) {
    gcloud run jobs update $JobName `
        --image $Image `
        --region $Region `
        --project $ProjectId `
        --command="npx","prisma","migrate","deploy" `
        --set-env-vars="DATABASE_URL=$DbUrl" `
        --set-cloudsql-instances=$CloudSqlInstance `
        --quiet
} else {
    gcloud run jobs create $JobName `
        --image $Image `
        --region $Region `
        --project $ProjectId `
        --command="npx","prisma","migrate","deploy" `
        --set-env-vars="DATABASE_URL=$DbUrl" `
        --set-cloudsql-instances=$CloudSqlInstance `
        --quiet
}


# 4. Execute the Job
Write-Host "`nExecuting Database Migration Job (This may take a minute)..." -ForegroundColor Green
gcloud run jobs execute $JobName --region $Region --project $ProjectId --wait

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Database Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
