# Quick Start Guide - GlowSphere

## Automatic Setup (Recommended)

### Windows

1. **Make sure Docker Desktop is installed and running**
2. **Double-click `start-dev.bat`**
   - This will automatically:
     - Start MongoDB in Docker
     - Start the Backend server
     - Start the Frontend server
3. **Open your browser** to `http://localhost:5173`

### Mac/Linux

1. **Make sure Docker is installed and running**
2. **Run:**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```
   - This will automatically:
     - Start MongoDB in Docker
     - Start the Backend server
     - Start the Frontend server
3. **Open your browser** to `http://localhost:5173`

## Stopping the Services

### Windows

- Double-click `stop-dev.bat`
- Or close the terminal windows

### Mac/Linux

- Run: `./stop-dev.sh`
- Or press `Ctrl+C` in the terminal

## Manual Setup (If Docker is not available)

### Prerequisites

- Node.js 14+ installed
- MongoDB installed and running locally

### Steps

1. **Start MongoDB:**

   ```bash
   # Windows (if MongoDB is installed as service, it should auto-start)
   # Mac/Linux
   mongod --dbpath ./data/db
   ```

2. **Start Backend:**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend (in a new terminal):**

   ```bash
   npm install
   npm run dev
   ```

4. **Open browser** to `http://localhost:5173`

## Troubleshooting

### "Backend Server Not Running" message

- Make sure Docker is running
- Check if services are up: `docker-compose ps`
- Restart services: `docker-compose restart`

### Port already in use

- Stop other services using ports 27017, 5000, or 5173
- Or change ports in `docker-compose.yml`

### MongoDB connection issues

- Ensure Docker is running
- Check MongoDB container: `docker ps | grep mongodb`
- View logs: `docker-compose logs mongodb`

## Environment Variables

The app will work with default settings. Cloudinary is **optional** - the app works without it using local file storage.

### For Development

Create a `.env` file in the project root (optional):

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### For Production

Create a `.env` file in the project root:

```env
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name (optional)
CLOUDINARY_API_KEY=your_cloudinary_api_key (optional)
CLOUDINARY_API_SECRET=your_cloudinary_api_secret (optional)
```

### Getting Cloudinary Credentials

1. **Sign up for free:** https://cloudinary.com/users/register/free
2. **Go to Dashboard** after logging in
3. **Copy your credentials:**
   - Cloud Name
   - API Key
   - API Secret (click "Show" to reveal)

See `CLOUDINARY_SETUP.md` for detailed instructions with screenshots.

## Need Help?

- Check `docker-compose logs` for backend errors
- Check browser console for frontend errors
- Ensure all ports (27017, 5000, 5173) are available
