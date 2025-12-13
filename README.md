# GlowSphere - Social Learning Platform

GlowSphere is a mobile-first social learning app that combines group video conferencing, focused study tools, and a social feed for short videos and interactions.

## Features

### 🔥 Campfire (Group Video Chat)
- Secure, low-latency video conference rooms supporting 2–12 participants
- Unique join links with optional passcodes
- Host, co-host, and participant roles
- Audio/video controls, text chat, and raise hand feature
- Recording capabilities with consent management

### 📚 StudySuite (Focus Tools)
- Pomodoro timer with configurable intervals (default 25/5)
- Integrated note-taking area with rich-text support
- Session tracking and history
- Focus streaks and analytics
- Export and share notes functionality

### 📱 Feed (Social Video Feed)
- Instagram-like feed for short educational videos (15-60s)
- Like, comment, and share functionality
- Hashtag and user tagging
- Content discovery through following and recommendations
- Save/bookmark interesting content

## Tech Stack

- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **UI Components**: Lucide React icons

## Getting Started

### Quick Start (Recommended - Automatic MongoDB)

**Windows:**
1. Make sure Docker Desktop is installed and running
2. Double-click `start-dev.bat`
3. Open browser to `http://localhost:5173`

**Mac/Linux:**
1. Make sure Docker is installed and running
2. Run: `chmod +x start-dev.sh && ./start-dev.sh`
3. Open browser to `http://localhost:5173`

This will automatically start MongoDB, Backend, and Frontend for you!

### Manual Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```
3. Start MongoDB (if not using Docker)
4. Start the backend:
   ```bash
   cd backend && npm run dev
   ```
5. Start the frontend (in a new terminal):
   ```bash
   npm run dev
   ```

See `QUICK_START.md` for detailed instructions.

## Project Structure

```
src/
├── components/
│   ├── campfire/       # Video chat components
│   ├── studysuite/     # Pomodoro timer and notes
│   ├── feed/           # Social feed components
│   └── ui/             # Shared UI components
├── context/            # React context providers
├── pages/              # Page components
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Core Components

### Campfire
The Campfire component provides virtual study rooms where users can:
- Create and join video chat rooms
- Toggle audio/video settings
- Participate in group discussions
- Record sessions (with consent)
- Manage room participants

### StudySuite
The StudySuite component helps users focus on their studies with:
- A customizable Pomodoro timer
- Integrated note-taking during study sessions
- Session history and analytics
- Progress tracking and streaks

### Feed
The Feed component enables social learning through:
- Short educational video posts
- Social interactions (likes, comments, shares)
- Content discovery via hashtags and following
- User-generated learning content

## Responsive Design

GlowSphere is built with a mobile-first approach:
- Dedicated mobile navigation bar
- Responsive grid layouts
- Touch-friendly controls
- Optimized for both mobile and desktop experiences

## Authentication

The app uses React Context for authentication state management:
- Login/logout functionality
- User session persistence
- Protected routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.