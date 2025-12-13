#!/bin/bash

# GlowSphere Production Startup Script

echo "========================================"
echo "Starting GlowSphere Production Environment..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Start all services using production docker-compose
echo ""
echo "Starting all services with Docker Compose (Production mode)..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "========================================"
echo "GlowSphere Production Environment Started!"
echo "========================================"
echo ""
echo "Services are starting in the background..."
echo ""
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop services: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "Waiting 10 seconds for services to initialize..."
sleep 10

echo ""
echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo "Services should be available at:"
echo "========================================"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:5000"
echo "MongoDB: localhost:27017"
echo ""
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f docker-compose.prod.yml down"
echo ""

