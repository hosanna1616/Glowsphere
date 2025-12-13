# GlowSphere Backend API

This is the backend API for the GlowSphere application, built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Real-time messaging with Socket.IO
- File uploads with Cloudinary
- RESTful API endpoints
- MongoDB database integration
- Secure password hashing with bcrypt
- CORS protection and security headers

## Prerequisites

- Node.js v14 or higher
- MongoDB database
- Cloudinary account for file storage

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Cloudinary credentials

## Environment Variables

Create a `.env` file in the root of the backend directory with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/glowsphere
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on port 5000 (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Posts (Feed)

- `POST /api/posts` - Create a new post
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get a specific post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post
- `PUT /api/posts/:id/like` - Like/unlike a post
- `POST /api/posts/:id/comments` - Add a comment to a post
- `DELETE /api/posts/:postId/comments/:commentId` - Delete a comment from a post

### Campfire (Messaging)

- `POST /api/campfire/rooms` - Create a new room
- `GET /api/campfire/rooms` - Get all rooms
- `GET /api/campfire/rooms/:id` - Get a specific room
- `PUT /api/campfire/rooms/:id` - Join a room
- `POST /api/campfire/rooms/:id/leave` - Leave a room
- `PUT /api/campfire/rooms/:id/audio` - Toggle participant audio
- `PUT /api/campfire/rooms/:id/video` - Toggle participant video
- `GET /api/campfire/rooms/:id/messages` - Get room messages
- `POST /api/campfire/rooms/:id/messages/text` - Send a text message
- `POST /api/campfire/rooms/:id/messages/voice` - Send a voice message

### Quests (GlowQuest)

- `POST /api/quests` - Create a new quest
- `GET /api/quests` - Get all quests
- `GET /api/quests/:id` - Get a specific quest
- `PUT /api/quests/:id` - Update a quest
- `DELETE /api/quests/:id` - Delete a quest
- `PUT /api/quests/:id/progress` - Update quest progress
- `POST /api/quests/:id/support` - Support a quest
- `POST /api/quests/:id/unsupport` - Remove support from a quest
- `POST /api/quests/:id/comments` - Add a comment to a quest
- `DELETE /api/quests/:questId/comments/:commentId` - Delete a comment from a quest

### Study Materials (StudySuite)

- `POST /api/study` - Create a new study material
- `GET /api/study` - Get all study materials
- `GET /api/study/:id` - Get a specific study material
- `PUT /api/study/:id` - Update a study material
- `DELETE /api/study/:id` - Delete a study material
- `POST /api/study/:id/highlights` - Add a highlight to study material
- `DELETE /api/study/:id/highlights/:highlightId` - Remove a highlight from study material
- `GET /api/study/:id/download` - Download study material

## Real-time Events

The application uses Socket.IO for real-time communication:

### Connection Events

- `connection` - User connects
- `disconnect` - User disconnects

### Room Events

- `join_room` - Join a room
- `send_message` - Send a text message
- `receive_message` - Receive a text message
- `send_voice_message` - Send a voice message
- `receive_voice_message` - Receive a voice message

## Data Models

### User

- `_id`: ObjectId
- `name`: String
- `username`: String (unique)
- `email`: String (unique)
- `password`: String (hashed)
- `bio`: String
- `location`: String
- `avatar`: String (URL)
- `lastPeriod`: Date
- `cycleLength`: Number
- `interests`: [String]
- `goals`: [String]
- `challenges`: [String]
- `onboardingComplete`: Boolean
- `role`: String (user|admin)
- `isActive`: Boolean

### Post

- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `username`: String
- `content`: String
- `mediaUrl`: String (URL)
- `mediaType`: String (image|video)
- `tags`: [String]
- `likes`: [{ userId: ObjectId, timestamp: Date }]
- `comments`: [{ userId: ObjectId, username: String, text: String, timestamp: Date, likes: [ObjectId] }]
- `category`: String (general|career_tip|creativity|question|tip)

### Room

- `_id`: ObjectId
- `name`: String
- `hostId`: ObjectId (ref: User)
- `hostName`: String
- `maxParticipants`: Number
- `participants`: [{ userId: ObjectId, username: String, isHost: Boolean, isAudioOn: Boolean, isVideoOn: Boolean, joinedAt: Date }]
- `isRecording`: Boolean
- `isActive`: Boolean

### Message

- `_id`: ObjectId
- `roomId`: ObjectId (ref: Room)
- `userId`: ObjectId (ref: User)
- `username`: String
- `text`: String
- `isVoice`: Boolean
- `voiceUrl`: String (URL)
- `duration`: Number
- `timestamp`: Date

### Quest

- `_id`: ObjectId
- `title`: String
- `description`: String
- `difficulty`: String (Beginner|Intermediate|Advanced)
- `xp`: Number
- `tags`: [String]
- `deadline`: Date
- `createdBy`: ObjectId (ref: User)
- `status`: String (draft|published|archived)
- `progress`: [{ userId: ObjectId, username: String, percentage: Number, completed: Boolean, updatedAt: Date }]
- `supporters`: [{ userId: ObjectId, username: String, timestamp: Date }]
- `comments`: [{ userId: ObjectId, username: String, text: String, timestamp: Date, likes: [ObjectId] }]

### StudyMaterial

- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `title`: String
- `description`: String
- `fileUrl`: String (URL)
- `fileType`: String (pdf|notebook)
- `highlights`: [{ text: String, color: String, position: { start: Number, end: Number }, timestamp: Date }]
- `tags`: [String]
- `isPublic`: Boolean
- `views`: Number
- `downloads`: Number

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS protection
- Helmet for security headers
- Rate limiting (to be implemented)
- Input validation (to be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.
