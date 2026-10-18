param(
    [string]$MigrationFile = "prisma/roles_permissions_migration.sql",
    [string]$SeedScript = "prisma/seed-roles.ts",
    [bool]$BuildImage = $true,
    [string]$ImageTag = "",
    [bool]$DeployService = $false
)

$ErrorActionPreference = "Stop"

$ProjectId = "tvk-command-centre-uat"
$Region = "asia-south1"
$ServiceName = "tcc-backend-staging"
$JobName = "tcc-migrate-staging"
$GarLocation = "asia-south1-docker.pkg.dev"
$Repository = "tcc-repo"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Staging Database Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Fetch DATABASE_URL from .env.staging
$DbUrl = ""
if (Test-Path "backend/.env.staging") {
    $envContent = Get-Content "backend/.env.staging"
    foreach ($line in $envContent) {
        if ($line.StartsWith("DATABASE_URL=")) {
            $DbUrl = $line.Substring("DATABASE_URL=".Length).Trim().Trim('`"').Trim("'")
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
if ($DbUrl -match "/cloudsql/([^/?&]+)") {
    $CloudSqlInstance = $matches[1]
}

# 2. Determine Image Tag and Image
if ([string]::IsNullOrWhiteSpace($ImageTag)) {
    try {
        $ImageTag = (git rev-parse --short HEAD).Trim()
    } catch {
        $ImageTag = "latest"
    }
}

$Image = "$GarLocation/$ProjectId/$Repository/${ServiceName}:$ImageTag"

# 3. Build Image if requested
if ($BuildImage) {
    Write-Host "`nRemotely building Backend Image using Google Cloud Build ($Image)..." -ForegroundColor Yellow
    gcloud auth configure-docker $GarLocation --quiet
    gcloud builds submit ./backend --tag $Image --project $ProjectId --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Google Cloud Build failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nUsing existing Image: $Image" -ForegroundColor Gray
}

# 4. Create or Update the Cloud Run Job for Migration
Write-Host "`nConfiguring Cloud Run Job ($JobName) for Migration ($MigrationFile)..." -ForegroundColor Yellow

$jobExists = (gcloud run jobs list --region $Region --project $ProjectId --format="value(metadata.name)" --filter="metadata.name=$JobName")
if ($jobExists) {
    gcloud run jobs update $JobName `
        --image $Image `
        --region $Region `
        --project $ProjectId `
        --command="npx,prisma,db,execute,--file,$MigrationFile" `
        --set-env-vars="DATABASE_URL=$DbUrl" `
        --set-cloudsql-instances=$CloudSqlInstance `
        --quiet
} else {
    gcloud run jobs create $JobName `
        --image $Image `
        --region $Region `
        --project $ProjectId `
        --command="npx,prisma,db,execute,--file,$MigrationFile" `
        --set-env-vars="DATABASE_URL=$DbUrl" `
        --set-cloudsql-instances=$CloudSqlInstance `
        --quiet
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to configure Cloud Run Job." -ForegroundColor Red
    exit 1
}

# 5. Execute Migration Job
Write-Host "`nExecuting Database Migration Job: $MigrationFile (This may take a minute)..." -ForegroundColor Green
gcloud run jobs execute $JobName --region $Region --project $ProjectId --wait

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Database migration job execution failed." -ForegroundColor Red
    exit 1
}

# 6. Configure & Execute Seed Job (if specified)
if (-not [string]::IsNullOrWhiteSpace($SeedScript)) {
    Write-Host "`nConfiguring Cloud Run Job to run seed script: $SeedScript..." -ForegroundColor Yellow
    gcloud run jobs update $JobName `
        --region $Region `
        --project $ProjectId `
        --command="npx,ts-node,$SeedScript" `
        --quiet

    Write-Host "`nExecuting Database Seed Job (This may take a minute)..." -ForegroundColor Green
    gcloud run jobs execute $JobName --region $Region --project $ProjectId --wait
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Seed job execution failed." -ForegroundColor Red
        exit 1
    }
}

# 7. Optionally Deploy Backend Service
if ($DeployService) {
    Write-Host "`nDeploying Backend Service to Cloud Run with Image: $Image..." -ForegroundColor Green
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
    $cmd = "gcloud run deploy $ServiceName --image $Image --region $Region --project $ProjectId --quiet $BackendEnvArgs"
    Invoke-Expression $cmd
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Database Migration & Seeding Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
