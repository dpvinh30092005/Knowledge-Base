@echo off
echo ====================================
echo Starting Food4Fit with Docker
echo ====================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and make sure it's running.
    pause
    exit /b 1
)

echo Docker is running!
echo.

echo Stopping any existing containers...
docker-compose down

echo.
echo Building and starting containers...
docker-compose up -d --build

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo ====================================
echo Checking container status...
echo ====================================
docker-compose ps

echo.
echo ====================================
echo Viewing application logs...
echo ====================================
docker-compose logs app --tail=50

echo.
echo ====================================
echo Application should be available at:
echo http://localhost:8080/auth/login
echo ====================================
echo.
echo To view logs: docker-compose logs -f app
echo To stop: docker-compose down
echo.

pause

