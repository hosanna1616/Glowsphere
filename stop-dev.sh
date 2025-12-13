#!/bin/bash

# GlowSphere Development Stop Script

echo "Stopping GlowSphere Development Environment..."

# Stop Docker Compose services
docker-compose down

# Kill frontend if running
pkill -f "vite" 2>/dev/null

echo ""
echo "All services stopped!"

