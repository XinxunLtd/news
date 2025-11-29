# Xinxun News - Automated Setup Script (PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Xinxun News - Automated Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "Step 1: Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Setup environment files
Write-Host "Step 2: Setting up environment files..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created backend\.env" -ForegroundColor Green
} else {
    Write-Host "✓ backend\.env already exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✓ Created frontend\.env.local" -ForegroundColor Green
} else {
    Write-Host "✓ frontend\.env.local already exists" -ForegroundColor Green
}
Write-Host ""

# Step 3: Build and start Docker containers
Write-Host "Step 3: Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose down
docker-compose build
docker-compose up -d
Write-Host "✓ Docker containers started" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for database to be ready
Write-Host "Step 4: Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✓ Database should be ready" -ForegroundColor Green
Write-Host ""

# Step 5: Info
Write-Host "Step 5: Database will be automatically migrated and seeded on first startup..." -ForegroundColor Yellow
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Services are starting up:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "  - Backend API: http://localhost:8080"
Write-Host "  - MySQL: localhost:3306"
Write-Host ""
Write-Host "Default Admin Credentials:"
Write-Host "  Username: admin"
Write-Host "  Password: admin123"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker-compose logs -f"
Write-Host "==========================================" -ForegroundColor Cyan

