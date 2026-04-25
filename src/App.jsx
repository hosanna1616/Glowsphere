import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StudyLockProvider, useStudyLock } from "./context/StudyLockContext";
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
import ParallelBloom from "./components/glowchallenge/ParallelBloom";
import Campfire from "./components/campfire/EnhancedCampfire";
import ModerationDashboard from "./components/admin/ModerationDashboard";
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

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, onboardingComplete } = useAuth();
  if (!isAuthenticated) {
    return children;
  }
  return onboardingComplete ? (
    <Navigate to="/feed" />
  ) : (
    <Navigate to="/onboarding" />
  );
};

const LockedAppRoute = ({ children }) => {
  const { isLocked } = useStudyLock();
  if (isLocked) {
    return <Navigate to="/studysuite" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/feed" />;
  }
  return children;
};

function App() {
  return (
    <NotificationProvider>
      <StudyLockProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
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
                <LockedAppRoute>
                  <Layout>
                    <Feed />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/echoes"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <Echoes />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/pulse"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <Pulse />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/glowlogs"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <GlowLogs />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/lumina-mirror"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <GlowLogs />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/glowquest"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <GlowQuest />
                  </Layout>
                </LockedAppRoute>
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
                <LockedAppRoute>
                  <Layout>
                    <GlowChallenge />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/glowchallenge/parallel-bloom"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Layout>
                    <ParallelBloom />
                  </Layout>
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/campfire"
            element={
              <AppRoute>
                <LockedAppRoute>
                  <Campfire />
                </LockedAppRoute>
              </AppRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <AppRoute>
                <AdminRoute>
                  <Layout>
                    <ModerationDashboard />
                  </Layout>
                </AdminRoute>
              </AppRoute>
            }
          />
        </Routes>
      </StudyLockProvider>
    </NotificationProvider>
  );
}

export default App;
