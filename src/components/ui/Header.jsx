import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import UserApi from "../../api/userApi";
import { resolveMediaUrl } from "../../utils/media";

const Header = () => {
  const { isAuthenticated, user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleAvatarButtonClick = () => {
    // On the home page, avatar tap takes user directly into feed.
    if (location.pathname === "/") {
      navigate("/feed");
      return;
    }
    setShowProfileMenu((prev) => !prev);
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const [avatarSrc, setAvatarSrc] = useState(resolveMediaUrl(user?.avatar));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setAvatarSrc(resolveMediaUrl(user?.avatar));
  }, [user?.avatar]);

  useEffect(() => {
    const syncHeaderProfile = async () => {
      if (!isAuthenticated || !apiClient.getToken()) {
        return;
      }

      try {
        const latestUser = await UserApi.getCurrentUser();
        if (!latestUser) {
          return;
        }

        const mergedUser = {
          ...user,
          ...latestUser,
          avatar: latestUser.avatar || user?.avatar || "",
        };
        setUser(mergedUser);
      } catch (error) {
        console.error("Failed to sync header profile:", error);
      }
    };

    syncHeaderProfile();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const avatarLabel = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="relative z-[70] overflow-visible p-4 md:p-6 flex justify-between items-center border-b border-amber-500/30 md:ml-20 lg:ml-64 transition-all duration-300 w-full max-w-full">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <img
          src="/glowsphere-logo.svg"
          alt="GlowSphere logo"
          className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover shadow-[0_0_18px_rgba(245,158,11,0.45)]"
        />
        <div className="text-xl md:text-2xl font-bold text-amber-400 truncate">
          GlowSphere
        </div>
      </div>
      <nav className="hidden md:flex space-x-4 lg:space-x-8 lg:hidden">
        <Link
          to="/feed"
          className="hover:text-amber-300 transition-colors text-sm lg:text-base"
        >
          Feed
        </Link>
        <Link
          to="/echoes"
          className="hover:text-amber-300 transition-colors text-sm lg:text-base"
        >
          Echoes
        </Link>
        <Link
          to="/pulse"
          className="hover:text-amber-300 transition-colors text-sm lg:text-base"
        >
          Pulse
        </Link>
        <Link
          to="/profile"
          className="hover:text-amber-300 transition-colors text-sm lg:text-base"
        >
          Profile
        </Link>
      </nav>
      {isAuthenticated ? (
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="hidden md:inline text-amber-300 text-sm lg:text-base truncate max-w-[150px] lg:max-w-none">
            Hi, {user?.name}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleAvatarButtonClick}
              className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden bg-stone-900 flex items-center justify-center text-amber-200 font-semibold"
              aria-label="Open profile menu"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarSrc("")}
                />
              ) : (
                avatarLabel
              )}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-amber-500/30 bg-stone-900 shadow-2xl z-[90] overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-500/20">
                  <p className="text-amber-100 text-sm font-semibold truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-amber-300/80 text-xs truncate">
                    @{user?.username || "profile"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-amber-100 hover:bg-stone-800"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-red-300 hover:bg-stone-800 border-t border-amber-500/20"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
