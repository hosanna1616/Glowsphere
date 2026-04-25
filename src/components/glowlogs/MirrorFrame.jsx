import React from "react";
import { motion } from "framer-motion";

const THEME_CLASSES = {
  rose_gold: "from-amber-400 via-yellow-300 to-amber-500",
  moonlit: "from-amber-500 via-stone-300 to-amber-400",
  fairy_lights: "from-amber-400 via-yellow-200 to-amber-500",
  sunset_blush: "from-amber-500 via-orange-300 to-amber-400",
};

const MirrorFrame = ({ quote, theme, children }) => {
  return (
    <section className="w-full rounded-[2rem] p-[2px] bg-gradient-to-r shadow-[0_0_36px_rgba(251,191,36,0.25)]">
      <div className={`rounded-[2rem] bg-gradient-to-r ${THEME_CLASSES[theme] || THEME_CLASSES.rose_gold} p-[2px]`}>
        <div className="rounded-[2rem] bg-black/95 min-h-[420px] p-6 md:p-8 relative overflow-hidden">
          <motion.div
            key={quote}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-lg md:text-2xl text-amber-100 font-semibold drop-shadow-[0_0_14px_rgba(251,191,36,0.45)] mb-6"
          >
            "{quote}"
          </motion.div>
          {children}
        </div>
      </div>
    </section>
  );
};

export default MirrorFrame;
