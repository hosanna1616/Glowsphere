# GlowSphere Deployment Guide

This guide explains how to deploy the GlowSphere application in production.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (if not using Docker)
- Cloudinary account for media storage

## Architecture Overview

The GlowSphere application consists of:

1. **Frontend**: React application served by Nginx
2. **Backend**: Node.js/Express API with MongoDB database
3. **Database**: MongoDB for data persistence
4. **Media Storage**: Cloudinary for file storage

## Production Deployment

### Using Docker Compose (Recommended)

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd glow-sphere
   ```

2. **Configure environment variables**:
   Create a `.env` file based on `.env.production`:

   ```bash
   cp .env.production .env
   ```

   Update the values in `.env` with your actual configuration:

   - MongoDB credentials
   - JWT secret
   - Cloudinary credentials

3. **Start the application**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - MongoDB: mongodb://localhost:27017

### Manual Deployment

#### Backend

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
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://username:password@localhost:27017/glowsphere
   JWT_SECRET=your_jwt_secret_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the backend**:

   ```bash
   npm start
   ```

   Or with PM2 for production:

   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   ```

#### Frontend

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the application**:

   ```bash
   npm run build
   ```

3. **Serve the build**:
   You can serve the build using any static file server. For example, with serve:
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

## Environment Variables

### Backend (.env)

```env
# Node.js Environment
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://username:password@localhost:27017/glowsphere

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (.env)

The frontend should be configured to point to your backend API:

```env
VITE_API_BASE_URL=http://your-domain.com:5000/api
VITE_WS_URL=ws://your-domain.com:5000
```

## Database Setup

### MongoDB

1. **Install MongoDB** (if not using Docker):
   Follow the official MongoDB installation guide for your OS.

2. **Create database and user**:
   ```bash
   mongo
   use glowsphere
   db.createUser({
     user: "glowsphere_user",
     pwd: "your_password",
     roles: [{ role: "readWrite", db: "glowsphere" }]
   })
   ```

## Monitoring and Logging

### Backend

The backend application logs to:

- Console (standard output)
- Log files in the `logs/` directory

Log rotation is handled automatically.

### Frontend

Frontend errors are logged to the browser console.

## Scaling

### Horizontal Scaling

The application is designed to scale horizontally:

1. **Backend**: Use PM2 cluster mode or multiple Docker containers
2. **Frontend**: Serve static files from a CDN
3. **Database**: Use MongoDB replica sets

### Load Balancing

For production deployments, use a load balancer like NGINX or HAProxy.

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure CORS appropriately
3. **Rate Limiting**: Built-in rate limiting for API endpoints
4. **Input Validation**: All inputs are validated
5. **Password Security**: Passwords are hashed with bcrypt
6. **JWT**: Secure JWT implementation

## Backup and Recovery

### MongoDB Backup

```bash
mongodump --host localhost:27017 --db glowsphere --out /backup/path
```

### Restore

```bash
mongorestore --host localhost:27017 --db glowsphere /backup/path/glowsphere
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 5000, and 27017 are available
2. **Permission errors**: Ensure Docker has necessary permissions
3. **Environment variables**: Verify all required environment variables are set

### Logs

Check logs for troubleshooting:

- Backend logs: `backend/logs/`
- Docker logs: `docker-compose logs`
- Browser console: For frontend issues

## Maintenance

### Updates

1. **Pull latest code**:

   ```bash
   git pull origin main
   ```

2. **Rebuild containers**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Monitoring

Regular monitoring tasks:

- Check disk space
- Monitor CPU and memory usage
- Review logs for errors
- Verify backups are working

## Support

For issues or questions, please:

1. Check the logs
2. Review this documentation
3. Open an issue on the repository
