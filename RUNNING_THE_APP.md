# Running the GlowSphere Application

This guide explains how to run the complete GlowSphere application in development and production environments.

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js 18 or higher
- npm (Node Package Manager)
- MongoDB (or Docker for containerized deployment)
- Git (to clone the repository)

## Quick Start (Docker Compose - Recommended)

The easiest way to run GlowSphere is using Docker Compose:

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd glow-sphere
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.production .env
   # Edit .env with your configuration
   ```

3. **Start the application**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

## Development Setup

### 1. Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/glowsphere
   JWT_SECRET=glowsphere_jwt_secret_key_2023
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. **Navigate to root directory**:

   ```bash
   cd ..
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the frontend development server**:

   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser to http://localhost:5173

## Using Startup Scripts

### Windows

Run the Windows batch file:

```bash
start-dev.bat
```

### macOS/Linux

Make the script executable and run it:

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## Manual Startup

If you prefer to start each component manually:

1. **Start MongoDB** (if running locally):

   ```bash
   mongod
   ```

2. **Start Backend**:

   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd ..
   npm run dev
   ```

## Accessing the Application

Once all services are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

### API Endpoints

- **Authentication**: `/api/auth/*`
- **Posts**: `/api/posts/*`
- **Campfire**: `/api/campfire/*`
- **Quests**: `/api/quests/*`
- **Study Materials**: `/api/study/*`
- **Notifications**: `/api/notifications/*`

### WebSocket Connection

- **Socket.IO**: ws://localhost:5000

## Testing the Application

### Backend Tests

Run the backend test suite:

```bash
cd backend
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Frontend Tests

Run the frontend test suite:

```bash
npm test
```

## Monitoring

### Health Checks

- **Backend Health**: http://localhost:5000/health
- **Backend Monitoring**: http://localhost:5000/monitoring

### Logs

- **Backend Logs**: `backend/logs/` directory
- **Docker Logs**: `docker-compose logs`

## Stopping the Application

### Docker Compose

```bash
docker-compose -f docker-compose.prod.yml down
```

### Manual Stop

Press `Ctrl+C` in each terminal window, or use the task manager to kill the processes.

### Windows Batch Script

If using the Windows batch script, press any key when prompted to stop all servers.

## Troubleshooting

### Common Issues

1. **Port already in use**:

   - Change the PORT in `.env` files
   - Kill processes using the ports:

     ```bash
     # Windows
     taskkill /f /im node.exe

     # macOS/Linux
     killall node
     ```

2. **MongoDB connection failed**:

   - Ensure MongoDB is running
   - Check MongoDB URI in `.env` file
   - Verify MongoDB credentials

3. **Cloudinary errors**:

   - Verify Cloudinary credentials in `.env` file
   - Check internet connection

4. **JWT errors**:
   - Ensure JWT_SECRET is set in backend `.env` file

### Checking Logs

1. **Backend logs**:

   ```bash
   tail -f backend/logs/*.log
   ```

2. **Docker logs**:

   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Browser console**:
   Open developer tools in your browser to check for frontend errors.

## Development Workflow

### Making Changes

1. **Frontend**: Edit files in `src/` directory
2. **Backend**: Edit files in `backend/src/` directory
3. **Auto-reload**: Both frontend and backend support hot-reloading

### Adding New Features

1. **Backend**:

   - Add new routes in `backend/src/routes/`
   - Add new controllers in `backend/src/controllers/`
   - Add new models in `backend/src/models/`

2. **Frontend**:
   - Add new components in `src/components/`
   - Add new API services in `src/api/`
   - Update routes in `src/App.jsx`

### Testing Changes

1. **Run tests**:

   ```bash
   npm test
   ```

2. **Check linting**:
   ```bash
   npm run lint
   ```

## Production Deployment

For production deployment, refer to the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) file.

## Support

For issues or questions:

1. Check the logs
2. Review this documentation
3. Open an issue on the repository
