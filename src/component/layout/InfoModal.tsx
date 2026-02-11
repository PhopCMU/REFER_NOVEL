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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center">
                  {icon && (
                    <span className="material-symbols-outlined text-blue-600 text-2xl mr-3">
                      {icon}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600">
                    close
                  </span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 text-gray-700 leading-relaxed">
                {children}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  <span className="material-symbols-outlined text-lg mr-2">
                    check
                  </span>
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;
