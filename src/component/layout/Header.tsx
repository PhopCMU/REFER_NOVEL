// src/components/layout/Header.tsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
        setShowNotifications(false);
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
  const handleNotificationClick = (id: number) => {
    // ทำเครื่องหมายว่าอ่านแล้ว
    console.log("Notification clicked:", id);
    setShowNotifications(false);
  };

  // ฟังก์ชันทำเครื่องหมายว่าอ่านแล้วทั้งหมด
  const markAllAsRead = () => {
    console.log("Mark all as read");
    setShowNotifications(false);
  };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    // ล้าง session หรือ token ตรงนี้
    console.log("Logging out...");
    navigate("/");
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
        <div className="relative" ref={notificationRef}>
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

          {/* Dropdown: Notifications */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50"
                style={{
                  boxShadow:
                    "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-blue-600 mr-2">
                        notifications
                      </span>
                      <h3 className="font-semibold text-gray-800">
                        การแจ้งเตือน
                      </h3>
                    </div>
                    <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {notifications.filter((notif) => !notif.read).length}
                    </span>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-all duration-200 ${
                          !notif.read
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : "bg-white"
                        }`}
                        onClick={() => handleNotificationClick(notif.id)}
                      >
                        <div className="flex items-start">
                          <div
                            className={`p-2 rounded-full mr-3 ${
                              notif.type === "success"
                                ? "bg-green-100 text-green-600"
                                : notif.type === "warning"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {notif.type === "success"
                                ? "check_circle"
                                : notif.type === "warning"
                                ? "warning"
                                : "info"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-gray-800 text-sm mb-1">
                                {notif.title}
                              </p>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {notif.time}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                        {!notif.read && (
                          <div className="mt-2">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">
                        notifications_off
                      </span>
                      <p className="text-gray-500 text-sm">
                        ไม่มีแจ้งเตือนใหม่
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 flex justify-between items-center">
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors duration-200"
                    onClick={() => {
                      navigate("/novel/notifications");
                      setShowNotifications(false);
                    }}
                  >
                    <span className="material-symbols-outlined text-sm mr-1">
                      list_alt
                    </span>
                    ดูทั้งหมด
                  </button>
                  {notifications.some((notif) => !notif.read) && (
                    <button
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center transition-colors duration-200"
                      onClick={markAllAsRead}
                    >
                      <span className="material-symbols-outlined text-sm mr-1">
                        done_all
                      </span>
                      ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center space-x-3 pl-2 border-l border-gray-200 relative"
          ref={profileRef}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">Dr. Somchai</p>
            <p className="text-xs text-gray-500">สัตวแพทย์</p>
          </div>
          <div className="relative">
            <img
              src="https://ui-avatars.com/api/?name=Dr.+Vet&background=4f46e5&color=fff&size=128&bold=true&font-size=0.5"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
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
                      Dr. Somchai
                    </p>
                    <p className="text-xs text-gray-500">
                      somchai@animalhospital.com
                    </p>
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
