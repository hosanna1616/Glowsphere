@echo off
REM GlowSphere Production Stop Script for Windows

echo Stopping GlowSphere Production Environment...

REM Stop Docker Compose services
docker-compose -f docker-compose.prod.yml down

echo.
echo All production services stopped!
pause

