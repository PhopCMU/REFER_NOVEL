import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./component/layout/Sidebar";
import Header from "./component/layout/Header";
import Footer from "./component/layout/Footer";

interface AppProps {
  children: React.ReactNode;
}

const App: React.FC<AppProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-18"
        }`}
        style={{
          marginLeft: isSidebarOpen
            ? window.innerWidth >= 768
              ? "256px"
              : "0"
            : window.innerWidth >= 768
            ? "72px"
            : "0",
        }}
      >
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
