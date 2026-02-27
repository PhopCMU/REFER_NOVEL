import { useState } from "react";
import InfoModal from "./InfoModal";
import { motion } from "framer-motion";

const Footer = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <footer className="bg-slate-900 border-t border-slate-800/50 px-6 py-5 mt-auto">
      {/* Main Footer Content */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Copyright Section */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-white text-sm">
              local_hospital
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">
              &copy; {new Date().getFullYear()} NOVEL & VET CMU Referral System
            </p>
            <p className="text-[10px] text-slate-600">
              All rights reserved. Version {import.meta.env.VITE_VERSION_APP}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal("privacy")}
            className="group relative px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
          >
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              นโยบายความเป็นส่วนตัว
            </span>
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"
              layoutId="footerUnderline"
            />
          </button>

          <span className="text-slate-700 text-xs">•</span>

          <button
            type="button"
            onClick={() => setActiveModal("terms")}
            className="group relative px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
          >
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              เงื่อนไขการใช้งาน
            </span>
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"
              layoutId="footerUnderline"
            />
          </button>

          <span className="text-slate-700 text-xs">•</span>

          <button
            type="button"
            onClick={() => setActiveModal("help")}
            className="group relative px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
          >
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              การช่วยเหลือ
            </span>
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"
              layoutId="footerUnderline"
            />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-xs text-slate-500">ระบบทำงานปกติ</span>
        </div>
      </div>

      {/* Modals */}
      {/* Privacy Policy Modal */}
      <InfoModal
        isOpen={activeModal === "privacy"}
        onClose={closeModal}
        title="นโยบายความเป็นส่วนตัว"
        icon="privacy_tip"
      >
        <div className="space-y-4">
          {/* Header Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">
                privacy_tip
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                นโยบายความเป็นส่วนตัว
              </h3>
              <p className="text-xs text-slate-400">
                อัปเดตล่าสุด: 1 มกราคม 2024
              </p>
            </div>
          </div>

          {/* Content Cards */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <span className="material-symbols-outlined text-blue-400 text-sm">
                    security
                  </span>
                </div>
                <p className="text-sm text-slate-300 flex-1">
                  เรารักษ์ข้อมูลส่วนบุคคลของท่านอย่างสูงสุด
                  ข้อมูลที่ท่านให้กับระบบจะถูกใช้เฉพาะเพื่อการส่งตัวสัตว์ป่วย
                  และการติดต่อระหว่างโรงพยาบาลเท่านั้น
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <span className="material-symbols-outlined text-blue-400 text-sm">
                    visibility_off
                  </span>
                </div>
                <p className="text-sm text-slate-300 flex-1">
                  เราไม่เปิดเผยข้อมูลให้กับบุคคลที่สามโดยไม่ได้รับความยินยอม
                  เว้นแต่ตามกฎหมายหรือหน่วยงานราชการร้องขอ
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20"
            >
              <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-blue-400">
                  database
                </span>
                ข้อมูลที่เราเก็บรวบรวม
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "ชื่อ นามสกุล สังกัดหน่วยงาน",
                  "อีเมลและเบอร์ติดต่อ",
                  "ข้อมูลการใช้งานระบบ",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <span className="material-symbols-outlined text-blue-400 text-sm">
                      check_circle
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </InfoModal>

      {/* Terms of Service Modal */}
      <InfoModal
        isOpen={activeModal === "terms"}
        onClose={closeModal}
        title="เงื่อนไขการใช้งาน"
        icon="policy"
      >
        <div className="space-y-4">
          {/* Header Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">
                policy
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                เงื่อนไขการใช้งาน
              </h3>
              <p className="text-xs text-slate-400">
                อัปเดตล่าสุด: 1 มกราคม 2024
              </p>
            </div>
          </div>

          {/* Content Cards */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <span className="material-symbols-outlined text-purple-400 text-sm">
                    verified_user
                  </span>
                </div>
                <p className="text-sm text-slate-300 flex-1">
                  การใช้งานระบบส่งตัวสัตว์ป่วยต้องเป็นผู้ลงทะเบียนและได้รับอนุญาตจากทางคณะสัตวแพทยศาสตร์
                  มหาวิทยาลัยเชียงใหม่
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <span className="material-symbols-outlined text-purple-400 text-sm">
                    block
                  </span>
                </div>
                <p className="text-sm text-slate-300 flex-1">
                  ผู้ใช้ต้องไม่กระทำการใด ๆ ที่ละเมิดกฎหมาย หรือทำให้ระบบขัดข้อง
                  เช่น การแฮก การใช้สคริปต์โจมตี
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
            >
              <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-purple-400">
                  warning
                </span>
                ข้อจำกัดความรับผิดชอบ
              </h4>
              <p className="text-sm text-slate-300">
                ทีมพัฒนาไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานผิดวัตถุประสงค์
                หรือการล่าช้าในการส่งตัว ซึ่งเกิดจากปัจจัยภายนอก เช่น
                สัญญาณอินเทอร์เน็ต หรือการยืนยันล่าช้าจากโรงพยาบาลปลายทาง
              </p>
            </motion.div>
          </div>
        </div>
      </InfoModal>

      {/* Help & Support Modal */}
      <InfoModal
        isOpen={activeModal === "help"}
        onClose={closeModal}
        title="การช่วยเหลือ"
        icon="support_agent"
      >
        <div className="space-y-4">
          {/* Header Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">
                support_agent
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">การช่วยเหลือ</h3>
              <p className="text-xs text-slate-400">
                ทีมสนับสนุนพร้อมให้บริการ
              </p>
            </div>
          </div>

          {/* Content Cards */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    help
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  หากท่านมีปัญหาในการใช้งานระบบ หรือต้องการความช่วยเหลือ
                  กรุณาติดต่อทีมสนับสนุนได้ที่:
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20"
            >
              <div className="space-y-4">
                {[
                  {
                    icon: "mail",
                    label: "อีเมล",
                    value: "sophon.m@cmu.ac.th",
                  },
                  {
                    icon: "call",
                    label: "โทร",
                    value: "053-948-031, 053-948-112",
                  },
                  {
                    icon: "schedule",
                    label: "เวลางาน",
                    value: "จันทร์ - อาทิตย์ 08:30 - 16:30 น.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400 text-base">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs text-green-400">{item.label}</p>
                      <p className="text-sm text-white font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-green-500/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    menu_book
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  หรือเยี่ยมชม{" "}
                  <a
                    href="#"
                    className="text-green-400 hover:text-green-300 font-medium underline decoration-green-500/30"
                  >
                    ศูนย์ช่วยเหลือออนไลน์
                  </a>{" "}
                  เพื่อดูคู่มือการใช้งานแบบละเอียด
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </InfoModal>
    </footer>
  );
};

export default Footer;
