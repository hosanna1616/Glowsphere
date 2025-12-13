#!/bin/bash

# GlowSphere Development Startup Script

echo "========================================"
echo "Starting GlowSphere Development Environment..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Start MongoDB and Backend using Docker Compose
echo ""
echo "[1/3] Starting MongoDB and Backend with Docker Compose..."
docker-compose up -d mongodb backend

# Wait for services to be ready
echo ""
echo "[2/3] Waiting for services to be ready..."
sleep 5

# Check if backend is responding
echo "Checking backend health..."
until curl -s http://localhost:5000/health > /dev/null 2>&1; do
    echo "Backend is starting, please wait..."
    sleep 2
done

echo "Backend is ready!"
echo ""

# Start frontend development server
echo "[3/3] Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "GlowSphere Development Environment Started!"
echo "========================================"
echo ""
echo "MongoDB: Running on port 27017"
echo "Backend: Running on http://localhost:5000"
echo "Frontend: Starting on http://localhost:5173"
echo ""
echo "To stop all services, press Ctrl+C or run: ./stop-dev.sh"
echo ""

# Trap SIGINT to stop services
trap "echo ''; echo 'Stopping services...'; docker-compose down; kill $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for frontend process
wait $FRONTEND_PID