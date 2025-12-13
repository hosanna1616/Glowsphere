# 🚀 START HERE - GlowSphere Setup

## Quick Start (3 Steps)

### Step 1: Install Docker Desktop
- **Windows/Mac:** Download from https://www.docker.com/products/docker-desktop
- **Linux:** Run `sudo apt-get install docker.io docker-compose` (Ubuntu/Debian)
- Launch Docker Desktop and wait for it to start

### Step 2: Start the Application

**Windows:**
```
Double-click: start-dev.bat
```

**Mac/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Step 3: Open Your Browser
```
http://localhost:5173
```

That's it! 🎉

---

## What Happens Automatically

When you run the start script, it will:
1. ✅ Start MongoDB database in Docker
2. ✅ Start Backend API server (port 5000)
3. ✅ Start Frontend development server (port 5173)
4. ✅ Wait for everything to be ready

## Verify It's Working

1. **Check Docker:** Open Docker Desktop - you should see 2 containers running
2. **Check Backend:** Open http://localhost:5000/health - should show `{"status":"OK"}`
3. **Check Frontend:** Open http://localhost:5173 - should show the app

## Troubleshooting

### "Docker is not running"
→ Open Docker Desktop and wait for it to fully start

### "Port already in use"
→ Close other applications using ports 5000 or 5173

### "Cannot connect to server"
→ Wait 10-15 seconds for services to start, then refresh

### Still having issues?
→ See `DOCKER_SETUP_GUIDE.md` for detailed troubleshooting

## Stopping the App

**Windows:** Double-click `stop-dev.bat`  
**Mac/Linux:** Run `./stop-dev.sh`

Or manually: `docker-compose down`

---

## Optional: Cloudinary Setup (For File Storage)

Cloudinary is **optional** - the app works without it! But if you want cloud storage for images/videos:

1. **Sign up free:** https://cloudinary.com/users/register/free
2. **Get credentials from Dashboard**
3. **Add to `.env` file** (see `CLOUDINARY_SETUP.md` for details)

The app will use local file storage if Cloudinary isn't configured.

## Need More Help?

- 📖 **Detailed Setup:** See `DOCKER_SETUP_GUIDE.md`
- 🚀 **Quick Reference:** See `QUICK_START.md`
- ☁️ **Cloudinary Setup:** See `CLOUDINARY_SETUP.md`
- 🐳 **Docker Issues:** See Docker Desktop logs

