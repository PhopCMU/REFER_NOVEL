import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InfoModalProps {
  isOpen: boolean;
  icon: string;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div
              className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Dynamic gradient based on icon */}
              <div
                className={`
                  flex items-center justify-between p-6 rounded-t-2xl
                  ${icon === "privacy_tip" ? "bg-linear-to-r from-blue-600/20 to-indigo-600/20 border-b border-blue-500/30" : ""}
                  ${icon === "policy" ? "bg-linear-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30" : ""}
                  ${icon === "support_agent" ? "bg-linear-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30" : ""}
                `}
              >
                <div className="flex items-center">
                  {icon && (
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center mr-3
                        ${icon === "privacy_tip" ? "bg-linear-to-br from-blue-500 to-indigo-600" : ""}
                        ${icon === "policy" ? "bg-linear-to-br from-purple-500 to-pink-600" : ""}
                        ${icon === "support_agent" ? "bg-linear-to-br from-green-500 to-emerald-600" : ""}
                      `}
                    >
                      <span className="material-symbols-outlined text-white text-xl">
                        {icon}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {icon === "privacy_tip" &&
                        "ข้อมูลส่วนบุคคลและการคุ้มครอง"}
                      {icon === "policy" && "ข้อตกลงและเงื่อนไขการใช้งาน"}
                      {icon === "support_agent" && "ติดต่อทีมสนับสนุน"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-white">
                    close
                  </span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 text-slate-300 leading-relaxed">
                {children}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 rounded-b-2xl flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className={`
                    px-6 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition-all
                    ${icon === "privacy_tip" ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""}
                    ${icon === "policy" ? "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                    ${icon === "support_agent" ? "bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" : ""}
                  `}
                >
                  <span className="material-symbols-outlined text-lg mr-2">
                    check
                  </span>
                  เข้าใจแล้ว
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;
