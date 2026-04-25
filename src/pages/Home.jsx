import React from "react";
import { Navigate } from "react-router-dom";
import Header from "../components/ui/Header";
import Hero from "../components/ui/Hero";
import Features from "../components/ui/Features";
import Community from "../components/ui/Community";
import Footer from "../components/ui/Footer";
import { useAuth } from "../context/AuthContext";
import { useStudyLock } from "../context/StudyLockContext";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { isLocked } = useStudyLock();

  if (isAuthenticated && isLocked) {
    return <Navigate to="/studysuite" />;
  }

  return (
    <div className="min-h-screen gradient-bg text-amber-200 overflow-x-hidden w-full max-w-full">
      <Header />

      <main className="container mx-auto px-4 py-12 w-full max-w-full overflow-x-hidden">
        <Hero />
        <Features />
        <Community />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
