import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg text-amber-200 overflow-x-hidden w-full max-w-full">
      <Sidebar />
      <Header />
      <main className="container mx-auto px-4 py-8 md:ml-20 lg:ml-64 pb-16 lg:pb-8 transition-all duration-300 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Layout;