import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Feed from "./components/feed/InstagramFeed";
import Echoes from "./components/echoes/Echoes";
import Pulse from "./components/pulse/Pulse";
import Profile from "./components/profile/Profile";
import GlowLogs from "./components/glowlogs/GlowLogs";
import GlowQuest from "./components/glowquest/GlowQuest";
import StudySuite from "./components/studysuite/StudySuite";
import GlowChallenge from "./components/glowchallenge/GlowChallenge";
import Campfire from "./components/campfire/EnhancedCampfire";
import Layout from "./components/ui/Layout";
import Sidebar from "./components/ui/Sidebar";

// Protected Route Components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, onboardingComplete } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return onboardingComplete ? <Navigate to="/feed" /> : children;
};

const AppRoute = ({ children }) => {
  const { isAuthenticated, onboardingComplete } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" />;
  }
  return children;
};

function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <AppRoute>
              <Layout>
                <Feed />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/echoes"
          element={
            <AppRoute>
              <Layout>
                <Echoes />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/pulse"
          element={
            <AppRoute>
              <Layout>
                <Pulse />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AppRoute>
              <Layout>
                <Profile />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/glowlogs"
          element={
            <AppRoute>
              <Layout>
                <GlowLogs />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/glowquest"
          element={
            <AppRoute>
              <Layout>
                <GlowQuest />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/studysuite"
          element={
            <AppRoute>
              <Layout>
                <StudySuite />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/glowchallenge"
          element={
            <AppRoute>
              <Layout>
                <GlowChallenge />
              </Layout>
            </AppRoute>
          }
        />
        <Route
          path="/campfire"
          element={
            <AppRoute>
              <Campfire />
            </AppRoute>
          }
        />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
