import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { isAuthenticatedLocally } from "../utils/authUtils";

interface Props {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // เช็ค offline ก่อน → เร็วทันใจ
    const isValid = isAuthenticatedLocally();
    setIsAuth(isValid);
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
      return (
        <div className="min-h-screen bg-linear-to-br from-gray-900 to-black flex flex-col items-center justify-center p-4">
          <div className="relative">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl animate-pulse"></div>

            {/* Main Card */}
            <div className="relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              {/* Icon Container */}
              <div className="flex flex-col items-center gap-6">
                {/* Animated Shield Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-30 animate-ping"></div>
                  <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-blue-400" />
                  </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-3">
                  <h2 className="text-xl font-semibold text-white tracking-tight">
                    กำลังตรวจสอบสิทธิ์การเข้าใช้งาน
                  </h2>
                  <p className="text-gray-400 text-sm max-w-xs">
                    กำลังตรวจสอบข้อมูลผู้ใช้และสิทธิ์การเข้าถึง
                    กรุณารอสักครู่...
                  </p>
                </div>

                {/* Animated Loader */}
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-400 font-medium">
                    กำลังโหลด
                  </span>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3].map((dot) => (
                    <div
                      key={dot}
                      className="w-2 h-2 rounded-full bg-blue-400/50"
                      style={{
                        animation: `pulse 1.5s ease-in-out infinite ${dot * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                ระบบความปลอดภัยสูง • การเข้ารหัสแบบ End-to-End
              </p>
            </div>
          </div>
        </div>
      );
    }

  return isAuth ? <>{children}</> : <Navigate to="/sign-in" replace />;
};

export default PrivateRoute;
