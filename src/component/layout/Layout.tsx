import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion } from "framer-motion";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import { getUserFromToken } from "../../utils/authUtils";
import { UserContextProvider } from "../../context/UserContext";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const userLogin = getUserFromToken();

  return (
    <UserContextProvider userLogin={userLogin as any}>
      <div className="flex min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <Sidebar
          isOpen={isSidebarOpen}
         
          user={userLogin as any}
        />

        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isSidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <Header
            user={userLogin as any}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />

          <main className="flex-1 p-2 md:p-2 overflow-auto rounded-4xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </main>

          <Footer user={userLogin} />
        </div>
      </div>
    </UserContextProvider>
  );
}
