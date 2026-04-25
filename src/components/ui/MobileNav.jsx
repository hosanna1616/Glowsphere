import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, User } from "lucide-react";
import { useStudyLock } from "../../context/StudyLockContext";
import { useAuth } from "../../context/AuthContext";

const MobileNav = () => {
  const location = useLocation();
  const { isLocked } = useStudyLock();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { name: "Feed", path: "/feed", icon: Home, shortName: "Feed" },
    { name: "Campfire", path: "/campfire", icon: Users, shortName: "Camp" },
    { name: "StudySuite", path: "/studysuite", icon: BookOpen, shortName: "Study" },
    { name: "Profile", path: "/profile", icon: User, shortName: "Profile" },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-amber-500/30 backdrop-blur-lg z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isBlocked = isLocked && item.path !== "/studysuite";
          
          return (
            <Link
              key={item.path}
              to={isBlocked ? "/studysuite" : item.path}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? "text-amber-400"
                  : isBlocked
                    ? "text-amber-100/40 hover:text-amber-100/50"
                    : "text-amber-200 hover:text-amber-300"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs text-center truncate w-full">{item.shortName}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
