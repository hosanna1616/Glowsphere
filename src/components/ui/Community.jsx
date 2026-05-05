import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Community = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleJoin = () => {
    if (isAuthenticated) {
      navigate("/feed");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="bg-card-bg rounded-2xl p-8 border border-amber-500/30 mb-16">
      <h2 className="text-3xl font-bold text-center mb-4 text-amber-300">
        Join a Sisterhood That Uplifts You
      </h2>
      <p className="text-center text-amber-200 max-w-2xl mx-auto mb-8">
        Surround yourself with women who cheer for your dreams, support your
        hard days, and celebrate your glow in every season of life.
      </p>
      <div className="flex justify-center">
        <button
          onClick={handleJoin}
          className="bg-gold-gradient px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {isAuthenticated ? "Go to Feed" : "Create Account"}
        </button>
      </div>
    </section>
  );
};

export default Community;
