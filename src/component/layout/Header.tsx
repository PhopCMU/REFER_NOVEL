// src/components/layout/Header.tsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserFromToken, removeToken } from "../../utils/authUtils";

interface HeaderProps {
  toggleSidebar: () => void;
}

// แมป path กับชื่อหน้า
const getTitleFromPath = (path: string): string => {
  const pathMap: Record<string, string> = {
    "/novel/animals": "ข้อมูลสัตว์ป่วย",
    "/novel/referral": "ส่งตัวสัตว์ป่วย",
    "/novel/status": "ตรวจสอบสถานะ",
    "/novel/report": "ขอผลการรักษา",
    "/novel/notifications": "การแจ้งเตือน",
    "/novel/profile": "โปรไฟล์",
  };

  for (const [key, value] of Object.entries(pathMap)) {
    if (path.includes(key)) return value;
  }
  return "Dashboard";
};

// ตัวอย่างข้อมูลแจ้งเตือน
const notifications = [
  {
    id: 1,
    title: "ส่งตัวสำเร็จ",
    message: "สัตว์ป่วย 'ลั่นทม' ถูกส่งต่อเรียบร้อย",
    time: "5 นาทีที่แล้ว",
    read: false,
    type: "success",
  },
  {
    id: 2,
    title: "รอการยืนยัน",
    message: "โรงพยาบาลยังไม่ยืนยันการรับส่งตัว",
    time: "1 ชั่วโมงที่แล้ว",
    read: false,
    type: "warning",
  },
  {
    id: 3,
    title: "ผลการรักษา",
    message: "ผลการรักษา 'มูทู' พร้อมให้ดาวน์โหลดแล้ว",
    time: "วานนี้",
    read: true,
    type: "info",
  },
  {
    id: 4,
    title: "นัดหมายใหม่",
    message: "มีนัดหมายตรวจสัตว์ป่วยในวันพรุ่งนี้",
    time: "2 ชั่วโมงที่แล้ว",
    read: true,
    type: "info",
  },
];

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState(getTitleFromPath(location.pathname));
  // const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  //
  const user = getUserFromToken()!;

  console.log(user);

  // อัปเดต title เมื่อ path เปลี่ยน
  React.useEffect(() => {
    setTitle(getTitleFromPath(location.pathname));
  }, [location.pathname]);

  // คลิกนอก dropdown เพื่อปิด
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        // setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟังก์ชันจัดการการคลิกการแจ้งเตือน
  // const handleNotificationClick = (id: number) => {
  //   // ทำเครื่องหมายว่าอ่านแล้ว
  //   console.log("Notification clicked:", id);
  //   setShowNotifications(false);
  // };

  // ฟังก์ชันทำเครื่องหมายว่าอ่านแล้วทั้งหมด
  // const markAllAsRead = () => {
  //   console.log("Mark all as read");
  //   setShowNotifications(false);
  // };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    removeToken();
    navigate("/sign-in", { replace: true });
    toggleSidebar();
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center space-x-5">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50 flex items-center py-1.5 px-1"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Right: Icons + User */}
      <div className="flex items-center space-x-6">
        {/* Search Bar (optional) */}
        {/* <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2.5 w-72">
          <span className="material-symbols-outlined text-gray-500 text-lg mr-2">
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหา..."
            className="bg-transparent border-none focus:outline-none w-full text-gray-700 placeholder-gray-500"
          />
        </div> */}

        {/* Notifications */}
        {/* <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-500 hover:text-blue-600 relative p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl">
              notifications
            </span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
              {notifications.filter((notif) => !notif.read).length}
            </span>
          </button>
        </div> */}

        {/* User Profile */}
        <div
          className="flex items-center space-x-3 pl-2 border-l border-gray-200 relative"
          ref={profileRef}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">
              DVM {user?.firstName} {user?.lastName}
            </p>

            <p className="text-xs text-gray-500">{user?.hospitalName}</p>
          </div>
          <div className="relative group">
            {/* Glass morphism effect */}
            <div
              className="relative w-12 h-12 rounded-full backdrop-blur-md 
               bg-white/20 border border-white/50 shadow-xl
               cursor-pointer transform transition-all duration-300 
               hover:scale-110 hover:bg-white/30
               flex items-center justify-center"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>

              <span className="relative text-white font-bold text-lg drop-shadow-md">
                {user?.firstName?.charAt(0).toUpperCase()}
                {user?.lastName?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Status with glow effect */}
            <span className="absolute -bottom-0.5 -right-0.5">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            </span>
          </div>

          {/* Dropdown: Profile Menu */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-14 w-52 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50"
                style={{
                  boxShadow:
                    "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="p-2 ">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {user.firstName} {user.lastName}{" "}
                      <span className="text-[10px]">{user?.ceLicense}</span>
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-150 flex items-center"
                    onClick={() => {
                      navigate("/novel/profile");
                      setShowProfileMenu(false);
                    }}
                  >
                    <span className="material-symbols-outlined text-lg mr-2">
                      person
                    </span>
                    โปรไฟล์ของฉัน
                  </button>

                  <hr className="my-2 border-gray-200" />

                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 flex items-center"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined text-lg mr-2">
                      logout
                    </span>
                    ออกจากระบบ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
