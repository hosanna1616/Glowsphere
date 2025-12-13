# Deployment Changes Summary

This document summarizes the changes made to ensure the app works globally after deployment.

## Changes Made

### 1. ✅ Likes and Comments Persistence
- **Backend**: Updated `getPosts` controller to include `isLiked` and `isSaved` status for authenticated users
- **Frontend**: Comments are now properly loaded from database when posts are fetched
- **Result**: Likes and comments persist after page refresh because they're stored in the database

### 2. ✅ Profile Picture Upload
- **Backend**: 
  - Added file upload support to `updateUserProfile` controller
  - Updated auth routes to accept file uploads via `upload.single("avatar")`
  - Profile pictures are uploaded to Cloudinary (or local storage as fallback)
- **Frontend**: 
  - Added profile picture upload UI with preview
  - Added file validation (image type, max 5MB)
  - Profile picture updates are sent via FormData when file is selected
- **Result**: Users can now upload and change their profile pictures

### 3. ✅ Environment-Aware API URLs
- **Frontend**: Updated `apiClient.js` to use environment variable `VITE_API_BASE_URL`
- **Fallback**: Defaults to `http://localhost:5002/api` for local development
- **Result**: App can work globally by setting the environment variable to your production API URL

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5002/api
```

For production, set this to your deployed API URL:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Backend (.env)
The backend already uses environment variables. Make sure these are set:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (optional)
- `CLOUDINARY_API_KEY` - Cloudinary API key (optional)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (optional)

## Deployment Steps

1. **Set Environment Variables**
   - Frontend: Create `.env` file with `VITE_API_BASE_URL` pointing to your production API
   - Backend: Set all required environment variables

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Deploy Backend**
   - Ensure MongoDB is accessible
   - Ensure Cloudinary is configured (optional, falls back to local storage)
   - Start the backend server

4. **Deploy Frontend**
   - Serve the built files from `dist/` directory
   - Ensure the API URL in environment variable matches your backend URL

## Testing

After deployment, verify:
- ✅ Likes persist after page refresh
- ✅ Comments persist after page refresh
- ✅ Profile picture upload works
- ✅ API calls work from deployed frontend to deployed backend

## Notes

- The app uses Cloudinary for image storage, but falls back to local storage if Cloudinary is not configured
- All data (likes, comments, profile pictures) is stored in MongoDB
- The frontend automatically detects the API URL from environment variables

