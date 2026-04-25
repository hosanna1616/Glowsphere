import React from "react";
import { motion } from "framer-motion";

const StudyProgressRing = ({
  value = 0,
  size = 160,
  label = "Coverage",
  subtitle = "of this document",
  accentClass = "from-fuchsia-400 via-amber-300 to-yellow-200",
}) => {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(value)));
  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#lumina-progress)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="lumina-progress" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className={`bg-gradient-to-r ${accentClass} bg-clip-text text-transparent text-4xl font-bold`}>
          {normalizedValue}%
        </div>
        <div className="text-sm text-amber-100">{label}</div>
        <div className="text-xs text-amber-200/70">{subtitle}</div>
      </div>
    </div>
  );
};

export default StudyProgressRing;
