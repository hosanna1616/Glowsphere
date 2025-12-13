#!/bin/bash

# GlowSphere Production Stop Script

echo "Stopping GlowSphere Production Environment..."

# Stop Docker Compose services
docker-compose -f docker-compose.prod.yml down

echo ""
echo "All production services stopped!"

