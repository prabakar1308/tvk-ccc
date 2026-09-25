$ErrorActionPreference = "Stop"

$ProjectId = "tvk-command-centre-uat"
$Region = "asia-south1"
$GarLocation = "asia-south1-docker.pkg.dev"
$Repository = "tcc-repo"

# Use the git commit hash for the tag if available, otherwise use 'latest'
try {
    $Tag = (git rev-parse --short HEAD).Trim()
} catch {
    $Tag = "latest"
}

Write-Host "Starting Manual Staging Deployment to GCP (BACKEND ONLY)..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host "Image Tag: $Tag" -ForegroundColor Gray

# Ensure docker is configured with gcloud
Write-Host "`nAuthorizing Docker with gcloud..." -ForegroundColor Yellow
gcloud auth configure-docker $GarLocation --quiet

# 2. BACKEND DEPLOYMENT
Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "BACKEND DEPLOYMENT" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan
$BackendImage = "$GarLocation/$ProjectId/$Repository/tcc-backend-staging:$Tag"
Write-Host "Remotely building Backend Image using Google Cloud Build..." -ForegroundColor Green
gcloud builds submit ./backend --tag $BackendImage --project $ProjectId --quiet

Write-Host "Parsing backend/.env.staging..." -ForegroundColor Gray
$BackendEnvArgs = ""
if (Test-Path "backend/.env.staging") {
    $BackendVars = @()
    foreach ($line in Get-Content "backend/.env.staging") {
        if (-not [string]::IsNullOrWhiteSpace($line) -and $line -notmatch "^#") {
            $BackendVars += $line
        }
    }
    if ($BackendVars.Count -gt 0) {
        $joined = $BackendVars -join ","
        $BackendEnvArgs = "--set-env-vars=`"$joined`""
    }
}

Write-Host "Deploying Backend to Cloud Run..." -ForegroundColor Green
# using Invoke-Expression to handle optional arguments
$cmd = "gcloud run deploy tcc-backend-staging --image $BackendImage --region $Region --project $ProjectId --quiet $BackendEnvArgs"
Invoke-Expression $cmd

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Backend Deployment to Staging Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
