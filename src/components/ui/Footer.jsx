import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-amber-500/30 py-8 w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-4 text-center text-amber-300 w-full max-w-full">
        <p>© {currentYear} GlowSphere.</p>
      </div>
    </footer>
  );
};

export default Footer;
