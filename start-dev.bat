@echo off
REM GlowSphere Development Startup Script for Windows

echo ========================================
echo Starting GlowSphere Development Environment...
echo ========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start MongoDB and Backend using Docker Compose
echo.
echo [1/3] Starting MongoDB and Backend with Docker Compose...
docker-compose up -d mongodb backend

REM Wait for services to be ready
echo.
echo [2/3] Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check if backend is responding
echo Checking backend health...
:check_backend
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend is starting, please wait...
    timeout /t 2 /nobreak >nul
    goto check_backend
)

echo Backend is ready!
echo.

REM Start frontend development server
echo [3/3] Starting Frontend Development Server...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo GlowSphere Development Environment Started!
echo ========================================
echo.
echo MongoDB: Running on port 27017
echo Backend: Running on http://localhost:5000
echo Frontend: Starting on http://localhost:5173
echo.
echo To stop all services, run: docker-compose down
echo Or close this window and run stop-dev.bat
echo.
pause