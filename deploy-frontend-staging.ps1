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

Write-Host "Starting Manual Staging Deployment to GCP (FRONTEND ONLY)..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host "Image Tag: $Tag" -ForegroundColor Gray

# Ensure docker is configured with gcloud
Write-Host "`nAuthorizing Docker with gcloud..." -ForegroundColor Yellow
gcloud auth configure-docker $GarLocation --quiet

# 3. FRONTEND DEPLOYMENT
Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "FRONTEND DEPLOYMENT" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan
$FrontendImage = "$GarLocation/$ProjectId/$Repository/tcc-frontend-staging:$Tag"
Write-Host "Remotely building Frontend Image using Google Cloud Build..." -ForegroundColor Green
gcloud builds submit ./frontend --tag $FrontendImage --project $ProjectId --quiet

Write-Host "Parsing frontend/.env.staging..." -ForegroundColor Gray
$FrontendEnvArgs = ""
if (Test-Path "frontend/.env.staging") {
    $FrontendVars = @()
    foreach ($line in Get-Content "frontend/.env.staging") {
        if (-not [string]::IsNullOrWhiteSpace($line) -and $line -notmatch "^#") {
            $FrontendVars += $line
        }
    }
    if ($FrontendVars.Count -gt 0) {
        $joined = $FrontendVars -join ","
        $FrontendEnvArgs = "--set-env-vars=`"$joined`""
    }
}

Write-Host "Deploying Frontend to Cloud Run..." -ForegroundColor Green
$cmd = "gcloud run deploy tcc-frontend-staging --image $FrontendImage --region $Region --project $ProjectId --allow-unauthenticated --quiet $FrontendEnvArgs"
Invoke-Expression $cmd

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Frontend Deployment to Staging Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
