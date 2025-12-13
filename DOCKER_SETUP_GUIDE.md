# Docker Setup Guide - GlowSphere

## Prerequisites

### 1. Install Docker Desktop

**Windows:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer if prompted
4. Launch Docker Desktop from Start Menu
5. Wait for Docker to start (you'll see a whale icon in system tray)

**Mac:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Open the .dmg file and drag Docker to Applications
3. Launch Docker from Applications
4. Wait for Docker to start (you'll see a whale icon in menu bar)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and log back in for this to take effect
```

### 2. Verify Docker Installation

Open a terminal/command prompt and run:
```bash
docker --version
docker-compose --version
```

You should see version numbers. If not, Docker isn't installed correctly.

### 3. Start Docker Desktop

**Windows/Mac:**
- Open Docker Desktop application
- Wait until you see "Docker Desktop is running" in the status bar
- The whale icon should be steady (not animating)

**Linux:**
- Docker should start automatically
- Check with: `sudo systemctl status docker`

## Starting the Application

### Option 1: Automatic Start (Recommended)

**Windows:**
1. Open File Explorer
2. Navigate to the `glow` folder (C:\Users\Hp\Downloads\glow)
3. Double-click `start-dev.bat`
4. Wait for services to start (you'll see multiple terminal windows)
5. Open browser to: http://localhost:5173

**Mac/Linux:**
1. Open Terminal
2. Navigate to the project folder:
   ```bash
   cd ~/Downloads/glow
   ```
3. Make scripts executable (first time only):
   ```bash
   chmod +x start-dev.sh stop-dev.sh
   ```
4. Run the start script:
   ```bash
   ./start-dev.sh
   ```
5. Wait for services to start
6. Open browser to: http://localhost:5173

### Option 2: Manual Docker Compose Start

1. Open terminal/command prompt
2. Navigate to project folder:
   ```bash
   cd C:\Users\Hp\Downloads\glow  # Windows
   # or
   cd ~/Downloads/glow  # Mac/Linux
   ```

3. Start MongoDB and Backend:
   ```bash
   docker-compose up -d mongodb backend
   ```

4. Wait 10-15 seconds for services to start

5. Check if services are running:
   ```bash
   docker-compose ps
   ```
   You should see `glowsphere_mongodb` and `glowsphere_backend` as "Up"

6. Start Frontend (in a new terminal):
   ```bash
   npm install  # First time only
   npm run dev
   ```

7. Open browser to: http://localhost:5173

## Verifying Everything is Working

### Check Docker Containers
```bash
docker ps
```
You should see:
- `glowsphere_mongodb` (port 27017)
- `glowsphere_backend` (port 5000)

### Check Backend Health
Open browser to: http://localhost:5000/health
You should see: `{"status":"OK","timestamp":"..."}`

### Check Frontend
Open browser to: http://localhost:5173
You should see the GlowSphere app

## Common Issues and Solutions

### Issue 1: "Docker is not running"
**Solution:**
- Make sure Docker Desktop is open and running
- Check system tray/menu bar for Docker icon
- Restart Docker Desktop if needed

### Issue 2: "Port already in use"
**Solution:**
- Check what's using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  # Mac/Linux
  lsof -i :5000
  ```
- Stop the conflicting service or change ports in `docker-compose.yml`

### Issue 3: "Cannot connect to MongoDB"
**Solution:**
- Check MongoDB container is running: `docker ps | grep mongodb`
- View MongoDB logs: `docker-compose logs mongodb`
- Restart MongoDB: `docker-compose restart mongodb`

### Issue 4: "Backend not responding"
**Solution:**
- Check backend logs: `docker-compose logs backend`
- Restart backend: `docker-compose restart backend`
- Make sure MongoDB is running first

### Issue 5: "Permission denied" (Linux)
**Solution:**
```bash
sudo chmod +x start-dev.sh stop-dev.sh
# Or run with sudo (not recommended)
sudo ./start-dev.sh
```

## Stopping the Application

### Option 1: Use Stop Script

**Windows:**
- Double-click `stop-dev.bat`

**Mac/Linux:**
```bash
./stop-dev.sh
```

### Option 2: Manual Stop

```bash
# Stop all Docker services
docker-compose down

# Stop frontend (press Ctrl+C in the terminal running it)
```

## Viewing Logs

### View all logs:
```bash
docker-compose logs
```

### View specific service logs:
```bash
docker-compose logs mongodb
docker-compose logs backend
```

### Follow logs in real-time:
```bash
docker-compose logs -f backend
```

## Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart mongodb
```

## Complete Clean Start

If something goes wrong, do a complete reset:

```bash
# Stop and remove all containers
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

## Production Setup

For production deployment, use:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

See `DEPLOYMENT_GUIDE.md` for production details.

## Next Steps

Once everything is running:
1. Open http://localhost:5173
2. Create an account (signup)
3. Complete the Sisterhood Quiz
4. Start using the app!

## Need Help?

- Check logs: `docker-compose logs`
- Verify Docker: `docker ps`
- Check ports: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)
- Restart Docker Desktop if issues persist

