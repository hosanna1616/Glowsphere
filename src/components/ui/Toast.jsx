import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500/90",
    error: "bg-red-500/90",
    warning: "bg-yellow-500/90",
    info: "bg-blue-500/90",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 min-w-[300px] max-w-md animate-slideIn`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-lg"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

