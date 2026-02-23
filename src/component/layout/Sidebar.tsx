// src/components/layout/Sidebar.tsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Dog, Home, Podcast, Search, Send } from "lucide-react";
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: "ภาพรวมระบบ",
      icon: Home,
      path: "/novel/dashboard",
      showIf: (user: any) => user.aud === "vet",
    },
    {
      name: "เพิ่มข้อมูลสัตว์ป่วย",
      icon: Dog,
      path: "/novel/animals",
      showIf: (user: any) => user.aud === "vet",
    },
    {
      name: "ส่งตัวสัตว์ป่วย",
      icon: Send,
      path: "/novel/referral",
      showIf: (user: any) => user.aud === "vet",
    },
    {
      name: "ตรวจสอบสถานะ",
      icon: Search,
      path: "/novel/status",
      showIf: (user: any) => user.aud === "vet",
    },
    {
      name: "ขอผลการรักษา",
      icon: Podcast,
      path: "/novel/report",
      showIf: (user: any) => user.aud === "vet",
    },
    {
      name: "ข้อมูลสัตว์ป่วย (NOVEL)",
      icon: Podcast,
      path: "/novel/novel-report",
      showIf: (user: any) => user.aud === "vet-novel", // หมอ NOVEL
    },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => !item.showIf || item.showIf(user),
  );

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      className="fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-white to-blue-50 shadow-xl overflow-hidden flex flex-col"
      animate={{ width: isOpen ? "16rem" : "5rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-3 min-w-max">
          <motion.div
            className="p-2 bg-blue-100 rounded-lg flex items-center justify-center"
            animate={{
              width: isOpen ? "2.5rem" : "2rem",
              height: isOpen ? "2.5rem" : "2rem",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <span className="material-symbols-outlined text-blue-600">
              local_hospital
            </span>
          </motion.div>
          <motion.h1
            className="text-xl font-bold text-gray-800 whitespace-nowrap"
            initial={{ opacity: 1 }}
            animate={{
              opacity: isOpen ? 1 : 0,
              display: isOpen ? "block" : "none",
            }}
            transition={{ duration: 0.2 }}
          >
            VMVRCMU
          </motion.h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 mt-2 flex-1">
        {visibleMenuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <div key={index} className="relative group mb-2">
              <button
                onClick={() => navigate(item.path)}
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-250 w-full ${
                  active
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <motion.span
                  className={`material-symbols-outlined transition-all duration-250 flex-shrink-0 ${
                    active ? "text-blue-600" : "text-gray-500"
                  }`}
                  animate={{
                    fontSize: isOpen ? "1.5rem" : "1.25rem",
                    marginRight: isOpen ? "0.75rem" : "0rem",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-blue-400" : "text-gray-400"
                    }`}
                  />
                </motion.span>

                {/* แสดงชื่อเมื่อเปิด Sidebar เท่านั้น */}
                <motion.span
                  className={`font-medium whitespace-nowrap ${
                    active ? "text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                  initial={{ opacity: 1 }}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    display: isOpen ? "block" : "none",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
              </button>

              {/* Tooltip เมื่อ Sidebar ปิด */}
              {!isOpen && (
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1.5 w-max shadow-lg z-50 whitespace-nowrap transition-opacity duration-200">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-1 w-0 h-0 border-l-8 border-l-gray-800 border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Counter Widget */}
      <motion.div
        className="mx-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm"
        animate={{ padding: isOpen ? "0.75rem" : "0.5rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between">
          <motion.div
            animate={{
              opacity: isOpen ? 1 : 0,
              display: isOpen ? "block" : "none",
            }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-medium text-gray-600">
              สัตว์ป่วยทั้งหมด
            </p>
            <p className="text-xl font-bold text-blue-700">14 ตัว</p>
          </motion.div>

          <motion.div
            className="p-2 bg-blue-100 rounded-lg flex items-center justify-center"
            animate={{
              width: isOpen ? "2.5rem" : "2rem",
              height: isOpen ? "2.5rem" : "2rem",
              marginLeft: isOpen ? "0" : "auto",
              marginRight: isOpen ? "0" : "auto",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <span className="material-symbols-outlined text-blue-600">
              pets
            </span>
          </motion.div>

          <motion.div
            animate={{
              opacity: isOpen ? 0 : 1,
              display: isOpen ? "none" : "block",
            }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 transform -translate-x-1/2"
          >
            <p className="text-sm font-bold text-blue-700">14</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
