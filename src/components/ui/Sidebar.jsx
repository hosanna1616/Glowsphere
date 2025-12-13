import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  MessageCircle,
  Heart,
  User,
  BookOpen,
  Target,
  Lightbulb,
  Trophy,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const Sidebar = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: Home, shortName: "Home" },
    { name: "Feed", path: "/feed", icon: Home, shortName: "Feed" },
    { name: "Echoes", path: "/echoes", icon: MessageCircle, shortName: "Echoes" },
    { name: "Pulse", path: "/pulse", icon: Heart, shortName: "Pulse" },
    { name: "GlowLogs", path: "/glowlogs", icon: BookOpen, shortName: "Logs" },
    { name: "GlowQuest", path: "/glowquest", icon: Target, shortName: "Quest" },
    { name: "StudySuite", path: "/studysuite", icon: Lightbulb, shortName: "Study" },
    { name: "GlowChallenge", path: "/glowchallenge", icon: Trophy, shortName: "Challenge" },
    { name: "Campfire", path: "/campfire", icon: Users, shortName: "Camp" },
    { name: "Profile", path: "/profile", icon: User, shortName: "Profile" },
  ];

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile/Tablet Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card-bg border border-amber-500/30 rounded-lg p-2 text-amber-300 hover:bg-stone-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar - Full Width */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card-bg border-r border-amber-500/30 p-4 z-40 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold text-amber-400">GlowSphere</h1>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-amber-600 text-black font-semibold"
                          : "text-amber-200 hover:bg-stone-800"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="pt-4 border-t border-amber-500/30">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-amber-200 hover:bg-stone-800 w-full transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Sidebar - Drawer with Icons */}
      <div
        className={`fixed left-0 top-0 h-full bg-card-bg border-r border-amber-500/30 z-40 transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full w-20 md:w-24">
          <div className="mb-4 mt-16 px-2">
            <h1 className="text-lg md:text-xl font-bold text-amber-400 text-center truncate">
              Glow
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-2">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg transition-colors group ${
                        isActive
                          ? "bg-amber-600 text-black font-semibold"
                          : "text-amber-200 hover:bg-stone-800"
                      }`}
                      title={item.name}
                    >
                      <Icon size={22} className="mb-1" />
                      <span className="text-xs text-center truncate w-full">
                        {item.shortName}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="pt-4 border-t border-amber-500/30 px-2 pb-4">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center px-2 py-3 rounded-lg text-amber-200 hover:bg-stone-800 w-full transition-colors"
              title="Logout"
            >
              <LogOut size={22} className="mb-1" />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile/tablet */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;