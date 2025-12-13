import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Hero = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/feed");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="text-center mb-16">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 text-amber-400">
        Illuminate Your Digital Journey
      </h1>
      <p className="text-xl text-amber-200 max-w-2xl mx-auto mb-10">
        Connect, share, and grow in a vibrant community of like-minded
        individuals passionate about technology and innovation.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={handleGetStarted}
          className="bg-gold-gradient px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate("/echoes")}
          className="border border-amber-500/30 px-8 py-3 rounded-full text-lg font-semibold hover:bg-amber-900/30 transition-colors"
        >
          Learn More
        </button>
      </div>
    </section>
  );
};

export default Hero;
