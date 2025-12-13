@echo off
REM GlowSphere Development Stop Script for Windows

echo Stopping GlowSphere Development Environment...

REM Stop Docker Compose services
docker-compose down

REM Kill frontend if running
taskkill /f /im node.exe /fi "WINDOWTITLE eq Frontend*" >nul 2>&1

echo.
echo All services stopped!
pause

