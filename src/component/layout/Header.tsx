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
  report: { title: "ขอผลการรักษา", icon: "description" },
  notifications: { title: "การแจ้งเตือน", icon: "notifications" },
  profile: { title: "โปรไฟล์", icon: "account_circle" },
  dashboard: { title: "แดชบอร์ด", icon: "dashboard" },
  appointments: { title: "การนัดหมาย", icon: "event" },
  "medical-records": { title: "ประวัติการรักษา", icon: "medical_services" },
  billing: { title: "การชำระเงิน", icon: "receipt" },
  statistics: { title: "สถิติ", icon: "bar_chart" },
  settings: { title: "ตั้งค่าระบบ", icon: "settings" },
  users: { title: "จัดการผู้ใช้", icon: "people" },
  medicines: { title: "คลังยา", icon: "medication" },
  equipment: { title: "ครุภัณฑ์", icon: "precision_manufacturing" },
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
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
      {/* ซ้าย: ปุ่มเมนู + ชื่อหน้า + ไอคอน */}
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          onClick={toggleSidebar}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="เปิด/ปิดเมนู"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-white border border-gray-200 group-hover:border-blue-200 transition-all duration-300">
            <span className="material-symbols-outlined text-2xl text-gray-600 group-hover:text-blue-600 transition-colors">
              menu
            </span>
          </div>
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></div>

          {/* ไอคอนของหน้าปัจจุบัน */}
          <motion.div
            key={pageIcon}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center border border-blue-100"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-blue-600">
              {pageIcon}
            </span>
          </motion.div>

          {/* ชื่อหน้าแบบ Animated */}
          <motion.h1
            key={currentTitle}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
          >
            {currentTitle}
          </motion.h1>
        </div>
      </div>

      {/* ขวา: โปรไฟล์ผู้ใช้ */}
      <div className="flex items-center gap-4" ref={profileRef}>
        {/* Breadcrumb แบบย่อ */}
        <motion.div
          className="hidden lg:flex items-center gap-1 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label="เส้นทางนำทาง"
        >
          {location.pathname
            .split("/")
            .filter(Boolean)
            .map((segment, index, array) => {
              if (index === array.length - 1) return null;
              return (
                <div key={index} className="flex items-center">
                  <span className="hover:text-gray-600 cursor-pointer transition-colors">
                    {formatTitleFromSegment(segment)}
                  </span>
                  {index < array.length - 2 && (
                    <span
                      className="material-symbols-outlined text-sm mx-1"
                      aria-hidden="true"
                    >
                      chevron_right
                    </span>
                  )}
                </div>
              );
            })}
        </motion.div>

        {/* User Info Card */}
        <motion.div
          className="hidden lg:flex items-center gap-4 pr-4 border-r border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Hospital Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
            <span
              className="material-symbols-outlined text-blue-500 text-base"
              aria-hidden="true"
            >
              domain
            </span>
            <span className="text-xs font-medium text-blue-700">
              {user?.hospitalName || "โรงพยาบาล"}
            </span>
          </div>

          {/* User Details */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <p className="text-sm font-semibold text-gray-800">
                {user?.firstName || ""} {user?.lastName || ""}
              </p>
              {user?.ceLicense && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium border border-amber-200">
                  {user.ceLicense}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
              <span
                className="material-symbols-outlined text-xs"
                aria-hidden="true"
              >
                mail
              </span>
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
            {/* วงแหวนหมุนเมื่อ hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-500 animate-spin-slow"></div>

            {/* Avatar Container */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {user?.firstName?.charAt(0).toUpperCase() || "U"}
                  {user?.lastName?.charAt(0).toUpperCase() || "S"}
                </span>
              </div>
            </div>

            {/* Online Status */}
            <div className="absolute -bottom-1 -right-1">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
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
                className="absolute right-0 top-14 w-72 bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden z-50"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                role="menu"
              >
                {/* Header Gradient */}
                <div className="h-10 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
                  <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full"></div>
                </div>

                {/* Profile Info */}
                <div className="relative px-4 pb-2">
                  {/* <div className="absolute -top-10 left-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center border-4 border-white">
                      <span className="text-white font-bold text-xl">
                        {user?.firstName?.charAt(0).toUpperCase() || "U"}
                        {user?.lastName?.charAt(0).toUpperCase() || "S"}
                      </span>
                    </div>
                  </div> */}

                  <div className="mt-2 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100">
                        {user?.ceLicense || "แพทย์"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                      <span
                        className="material-symbols-outlined text-sm"
                        aria-hidden="true"
                      >
                        badge
                      </span>
                      {user?.hospitalName}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 border-t border-gray-100">
                  <motion.button
                    type="button"
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      navigate("/novel/profile");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 flex items-center gap-3 group text-left"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <span
                        className="material-symbols-outlined text-lg text-blue-600 group-hover:text-white"
                        aria-hidden="true"
                      >
                        person
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">โปรไฟล์ของฉัน</p>
                      <p className="text-xs text-gray-400">
                        จัดการข้อมูลส่วนตัว
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-gray-400 text-base"
                      aria-hidden="true"
                    >
                      arrow_forward_ios
                    </span>
                  </motion.button>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>

                  <motion.button
                    type="button"
                    whileHover={{ x: 4 }}
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-xl transition-all duration-200 flex items-center gap-3 group text-left"
                    role="menuitem"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-200">
                      <span
                        className="material-symbols-outlined text-lg text-red-600 group-hover:text-white"
                        aria-hidden="true"
                      >
                        logout
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">ออกจากระบบ</p>
                      <p className="text-xs text-gray-400">
                        สิ้นสุดเซสชันการทำงาน
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-gray-400 text-base"
                      aria-hidden="true"
                    >
                      arrow_forward_ios
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
