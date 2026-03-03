import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowUpFromLine,
  BoxSelect,
  Dog,
  Home,
  Hospital,
  Search,
  Send,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    {
      name: "แดชบอร์ด",
      icon: Home,
      path: "/novel/dashboard",
      showIf: (user: any) => user.aud === "vet" || user.aud === "admin",
      badge: null,
    },
    {
      name: "เพิ่มข้อมูลสัตว์ป่วย",
      icon: Dog,
      path: "/novel/animals",
      showIf: (user: any) => user.aud === "vet",
      badge: null,
    },
    {
      name: "ส่งตัวสัตว์ป่วย",
      icon: Send,
      path: "/novel/referral",
      showIf: (user: any) => user.aud === "vet",
      badge: null,
    },
    {
      name: "ตรวจสอบสถานะ",
      icon: Search,
      path: "/novel/status",
      showIf: (user: any) => user.aud === "vet",
      badge: null,
    },

    {
      name: "Case Referral",
      icon: ArrowUpFromLine,
      path: "/novel/case-referral",
      showIf: (user: any) => user.aud === "admin",
      badge: null,
    },
    {
      name: "กำหนดสิทธิ์",
      icon: BoxSelect,
      path: "/novel/permission",
      showIf: (user: any) => user.aud === "admin" && user.role === "ADMIN",
      badge: null,
    },
    {
      name: "โรงพยาบาล/คลินิก",
      icon: Hospital,
      path: "/novel/hospital",
      showIf: (user: any) => user.aud === "admin" && user.role === "ADMIN",
      badge: null,
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
      className="fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl overflow-hidden flex flex-col"
      animate={{ width: isOpen ? "260px" : "80px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      {/* Header */}
      <div className="relative p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Logo Container */}
          <motion.div
            className="relative"
            animate={{
              scale: isOpen ? 1 : 0.9,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />

            {/* Logo */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-white text-xl">
                local_hospital
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{
              opacity: isOpen ? 1 : 0,
              x: isOpen ? 0 : -10,
              display: isOpen ? "block" : "none",
            }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-xl font-bold text-white">VMVRCMU</h1>
            <p className="text-xs text-blue-300/70 mt-0.5">Veterinary System</p>
          </motion.div>
        </div>

        {/* User Info - แสดงเมื่อ Sidebar เปิด */}
        {/* <AnimatePresence>
          {isOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 pt-4 border-t border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-blue-300/70">
                    {user.aud === "vet" ? "สัตวแพทย์" : "หมอ NOVEL"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {visibleMenuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
              onHoverStart={() => setHoveredItem(item.path)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              {/* Active Indicator */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <button
                onClick={() => navigate(item.path)}
                className={`
                  relative flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }
                `}
              >
                {/* Icon Container */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: hoveredItem === item.path ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? "text-blue-400" : "text-slate-400"
                    }`}
                  />

                  {/* Icon Glow */}
                  {active && (
                    <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full" />
                  )}
                </motion.div>

                {/* Menu Text */}
                <motion.span
                  className="ml-3 text-sm font-medium whitespace-nowrap flex-1 text-left"
                  initial={{ opacity: 1 }}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    display: isOpen ? "block" : "none",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>

                {/* Badge */}
                {item.badge && (
                  <motion.span
                    className="ml-3 text-xs font-semibold whitespace-nowrap flex-1 text-right"
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      display: isOpen ? "block" : "none",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </button>

              {/* Tooltip */}
              <AnimatePresence>
                {!isOpen && hoveredItem === item.path && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50"
                  >
                    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700 whitespace-nowrap">
                      {item.name}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        {/* Version Widget */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 backdrop-blur-sm cursor-pointer hover:border-blue-500/30 transition-colors group"
          animate={{
            padding: isOpen ? "0.75rem" : "0.5rem",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-indigo-600/0"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative flex items-center justify-between">
            {/* Version Info - Expanded */}
            <motion.div
              animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -10,
                display: isOpen ? "block" : "none",
              }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-slate-400">เวอร์ชั่นระบบ</p>
              <p className="text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {import.meta.env.VITE_VERSION_APP}
              </p>
            </motion.div>

            {/* Icon */}
            <motion.div
              className={`
                p-2 rounded-lg flex items-center justify-center
                ${isOpen ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20" : "bg-gradient-to-br from-blue-500 to-indigo-500"}
              `}
              animate={{
                scale: isOpen ? 1 : 1.1,
                marginLeft: isOpen ? 0 : "auto",
                marginRight: isOpen ? 0 : "auto",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            ></motion.div>

            {/* Version Badge - Collapsed */}
            <motion.div
              animate={{
                opacity: isOpen ? 0 : 1,
                display: isOpen ? "none" : "block",
              }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <p className="text-xs font-bold text-blue-400">
                v{import.meta.env.VITE_VERSION_APP}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
