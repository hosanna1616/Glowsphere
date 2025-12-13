import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="p-4 md:p-6 flex justify-between items-center border-b border-amber-500/30 md:ml-20 lg:ml-64 transition-all duration-300 w-full max-w-full overflow-x-hidden">
      <div className="text-xl md:text-2xl font-bold text-amber-400 truncate">
        GlowSphere
      </div>
      <nav className="hidden md:flex space-x-4 lg:space-x-8 lg:hidden">
        <Link to="/feed" className="hover:text-amber-300 transition-colors text-sm lg:text-base">
          Feed
        </Link>
        <Link to="/echoes" className="hover:text-amber-300 transition-colors text-sm lg:text-base">
          Echoes
        </Link>
        <Link to="/pulse" className="hover:text-amber-300 transition-colors text-sm lg:text-base">
          Pulse
        </Link>
        <Link to="/profile" className="hover:text-amber-300 transition-colors text-sm lg:text-base">
          Profile
        </Link>
      </nav>
      {isAuthenticated ? (
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="hidden md:inline text-amber-300 text-sm lg:text-base truncate max-w-[150px] lg:max-w-none">
            Hi, {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="bg-gold-gradient px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:opacity-90 transition-opacity font-semibold text-sm md:text-base"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="bg-gold-gradient px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:opacity-90 transition-opacity font-semibold text-sm md:text-base"
        >
          <span className="hidden sm:inline">Sign In</span>
          <span className="sm:hidden">In</span>
        </button>
      )}
    </header>
  );
};

export default Header;
