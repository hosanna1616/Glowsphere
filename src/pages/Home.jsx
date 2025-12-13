import React from "react";
import Header from "../components/ui/Header";
import Hero from "../components/ui/Hero";
import Features from "../components/ui/Features";
import Community from "../components/ui/Community";
import Footer from "../components/ui/Footer";

const Home = () => {
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
