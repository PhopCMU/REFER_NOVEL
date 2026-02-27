import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { removeToken } from "../../utils/authUtils";
import { LoadingForm } from "../LoadingForm";

//  ย้าย config ออกนอก component เพื่อป้องกัน re-creation ทุก render
const PATH_CONFIG: Record<string, { title: string; icon: string }> = {
  animals: { title: "ข้อมูลสัตว์ป่วย", icon: "pets" },
  referral: { title: "ส่งตัวสัตว์ป่วย", icon: "local_shipping" },
  status: { title: "ตรวจสอบสถานะ", icon: "assignment_turned_in" },
  dashboard: { title: "แดชบอร์ด", icon: "dashboard" },
  appointments: { title: "การนัดหมาย", icon: "event" },
};

//  กำหนด Interface สำหรับ User
interface UserType {
  firstName?: string;
  lastName?: string;
  email?: string;
  hospitalName?: string;
  ceLicense?: string;
  [key: string]: unknown; // อนุญาตให้มี property อื่นๆ เพิ่มเติม
}

//  Helper function สำหรับ format title จาก segment
const formatTitleFromSegment = (segment: string): string => {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Header = ({
  user,
  toggleSidebar,
}: {
  user: UserType;
  toggleSidebar: () => void;
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("แดชบอร์ด");
  const [pageIcon, setPageIcon] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  //  ใช้ useCallback เพื่อป้องกัน re-creation ทุก render
  const getTitleFromPath = useCallback(
    (path: string): { title: string; icon: string } => {
      const cleanPath = path.split("?")[0];
      const pathSegments = cleanPath.split("/").filter(Boolean);

      if (pathSegments.length === 0 || path === "/") {
        return { title: "แดชบอร์ด", icon: "dashboard" };
      }

      const lastSegment = pathSegments[pathSegments.length - 1];

      // กรณีตรงกับ config
      if (PATH_CONFIG[lastSegment]) {
        return PATH_CONFIG[lastSegment];
      }

      // กรณีเป็น sub-path เช่น /animals/123/edit
      if (pathSegments.length >= 2 && PATH_CONFIG[pathSegments[0]]) {
        const basePage = PATH_CONFIG[pathSegments[0]];
        const action = pathSegments[pathSegments.length - 1];

        const actionMap: Record<string, { prefix: string; icon: string }> = {
          edit: { prefix: "แก้ไข", icon: "edit" },
          create: { prefix: "เพิ่ม", icon: "add" },
          view: { prefix: "ดู", icon: "visibility" },
        };

        if (actionMap[action]) {
          return {
            title: `${actionMap[action].prefix}${basePage.title}`,
            icon: actionMap[action].icon,
          };
        }

        // กรณีเป็นรายละเอียดทั่วไป
        return { title: `รายละเอียด${basePage.title}`, icon: "info" };
      }

      // Fallback
      return {
        title: formatTitleFromSegment(lastSegment),
        icon: "article",
      };
    },
    [],
  );

  // อัปเดต title เมื่อ path เปลี่ยน
  useEffect(() => {
    const pageInfo = getTitleFromPath(location.pathname);
    setCurrentTitle(pageInfo.title);
    setPageIcon(pageInfo.icon);
  }, [location.pathname, getTitleFromPath]);

  // ปิดเมนูเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const handleLogout = () => {
    setIsLoading(true);
    setMessages("กำลังออกจากระบบ ...");
    setTimeout(() => {
      removeToken();
      navigate("/sign-in", { replace: true });
    }, 1500);
  };

  if (isLoading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xl pl-10">
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
      {/* Left: Menu Button + Page Title + Icon */}
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          onClick={toggleSidebar}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="เปิด/ปิดเมนู"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300"></div>

          {/* Button Background */}
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 group-hover:bg-slate-800 border border-slate-700 group-hover:border-blue-500/50 transition-all duration-300">
            <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-400 transition-colors">
              menu
            </span>
          </div>
        </motion.button>

        <div className="flex items-center gap-3">
          {/* Vertical Divider */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 rounded-full"></div>

          {/* Page Icon */}
          <motion.div
            key={pageIcon}
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-blue-500/30"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-blue-400">
              {pageIcon}
            </span>
          </motion.div>

          {/* Page Title */}
          <div className="flex flex-col">
            <motion.h1
              key={currentTitle}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
            >
              {currentTitle}
            </motion.h1>
            <p className="text-xs text-slate-500">ระบบจัดการข้อมูลสัตว์ป่วย</p>
          </div>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-4" ref={profileRef}>
        {/* Quick Actions */}
        <motion.div
          className="hidden lg:flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-all">
            <span className="material-symbols-outlined text-lg">
              notifications
            </span>
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-all">
            <span className="material-symbols-outlined text-lg">help</span>
          </button>
        </motion.div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px h-8 bg-slate-800"></div>

        {/* User Info Card */}
        <motion.div
          className="hidden lg:flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Hospital Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
            <span className="material-symbols-outlined text-blue-400 text-base">
              domain
            </span>
            <span className="text-xs font-medium text-slate-300">
              {user?.hospitalName || "โรงพยาบาล"}
            </span>
          </div>

          {/* User Details */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <p className="text-sm font-semibold text-white">
                {user?.firstName || ""} {user?.lastName || ""}
              </p>
              {user?.ceLicense && (
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded text-[10px] font-medium border border-amber-500/30">
                  {user.ceLicense}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <span className="material-symbols-outlined text-xs">mail</span>
              {user?.email || ""}
            </p>
          </div>
        </motion.div>

        {/* Profile Avatar with Menu */}
        <div className="relative">
          <motion.button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="เมนูโปรไฟล์"
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            {/* Rotating Ring Animation */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 blur-md"
              animate={showProfileMenu ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Avatar Container */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-800 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {user?.firstName?.charAt(1).toUpperCase() || "U"}
                </span>
              </div>
            </div>

            {/* Online Status */}
            <div className="absolute -bottom-1 -right-1">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900 shadow-md"></div>
              </div>
            </div>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-14 w-72 bg-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50"
                role="menu"
              >
                {/* Header with Gradient */}
                <div className="h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/5 rounded-full"></div>
                  <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full"></div>
                </div>

                {/* Profile Info */}
                <div className="relative px-4 pb-2 -mt-6">
                  <div className="absolute -top-10 left-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center border-2 border-slate-800">
                      <span className="text-white font-bold text-lg">
                        {user?.firstName?.charAt(1).toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30">
                        {user?.ceLicense || "แพทย์"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                      <span className="material-symbols-outlined text-sm">
                        badge
                      </span>
                      {user?.hospitalName}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 border-t border-slate-700/50">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      navigate("/novel/profile");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-slate-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-indigo-500/10 rounded-xl transition-all duration-200 flex items-center gap-3 group text-left"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                      <span className="material-symbols-outlined text-lg text-blue-400 group-hover:text-white">
                        person
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">โปรไฟล์ของฉัน</p>
                      <p className="text-xs text-slate-500">
                        จัดการข้อมูลส่วนตัว
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-base">
                      chevron_right
                    </span>
                  </motion.button>

                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2"></div>

                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-rose-500/10 rounded-xl transition-all duration-200 flex items-center gap-3 group text-left"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all duration-200">
                      <span className="material-symbols-outlined text-lg text-red-400 group-hover:text-white">
                        logout
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">ออกจากระบบ</p>
                      <p className="text-xs text-slate-500">
                        สิ้นสุดเซสชันการทำงาน
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-base">
                      chevron_right
                    </span>
                  </motion.button>
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
