# Testing Guide

This guide provides instructions for testing all the fixes implemented in the GlowSphere application.

## Prerequisites

1. Ensure Docker is installed and running
2. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Wait for all services to start (MongoDB, Backend, Frontend)

## Testing Campfire Room Creation

1. Navigate to the Campfire section
2. Click the "Create Room" button
3. Fill in the room name and select max participants
4. Click "Create Room"
5. Verify:
   - Room is created successfully
   - Room appears in the rooms list
   - You are automatically joined to the room
   - Error handling works (try creating without a name)

## Testing Profile Updates

1. Navigate to the Profile section
2. Make changes to your profile information
3. Click "Save Changes"
4. Verify:
   - Changes are saved successfully
   - Success message is displayed
   - Profile information is updated throughout the app
   - Error handling works (try using an existing username/email)

## Testing Comment Functionality

1. Navigate to the Feed section
2. Find a post and click the comment icon
3. Type a comment and press Enter or click "Post"
4. Verify:
   - Comment is added to the post
   - Comment count increases
   - Comment appears in the comments list
   - Error handling works (try posting without text)

## Testing Share Functionality

1. Navigate to the Feed section
2. Find a post and click the share icon
3. Verify:
   - Alert shows "Link copied to clipboard!"
   - Clipboard contains the correct post URL
   - Error handling works (try in environments where clipboard access is restricted)

## Testing Save Functionality

1. Navigate to the Feed section
2. Find a post and click the save icon (bookmark)
3. Verify:
   - Alert shows "Post saved to your bookmarks!"
   - Post is saved to user's bookmarks (check backend/database)
   - Error handling works (try when offline)

## Troubleshooting

If any functionality doesn't work as expected:

1. Check browser console for JavaScript errors
2. Verify backend API is running:
   ```bash
   curl http://localhost:5000/api/health
   ```
3. Check Docker container logs:
   ```bash
   docker-compose logs backend
   docker-compose logs mongodb
   ```
4. Ensure all environment variables are properly configured
5. Restart services if needed:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Expected Behavior

All functionality should work seamlessly with real-time updates and proper error handling. Users should receive immediate feedback for all actions, and data should persist across sessions.
