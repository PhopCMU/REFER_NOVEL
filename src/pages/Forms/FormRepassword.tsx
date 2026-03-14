import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDecodecryptQuery } from "../../utils/helpers";
import type {
  PayloadCheckOtpProps,
  PayloadResetPassword,
} from "../../types/type";

import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { showToast } from "../../utils/showToast";
import { LoadingForm } from "../../component/LoadingForm";
import { PutcheckOtp } from "../../api/PutApi";
import { ToastContainer } from "react-toastify";
import { PostNewPassword } from "../../api/PostApi";

interface RepasswordProps {
  email: string;
  exp: string;
  firstName: string;
  lastname: string;
  id: string;
  vet_codeId: string;
}

export default function FormRepassword() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  // State สำหรับ OTP 6 ช่อง
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const roter = useNavigate();

  // State สำหรับจับเวลา (15 นาที = 900 วินาที)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dataUser, setDataUser] = useState<RepasswordProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");

  //   === Recaptcha ===
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (!id) {
      setIsLoading(true);
      setMessages("มีการเข้าถึง URL ผิดพลาดเนื่องจากไม่มี id ...");
      setTimeout(() => {
        roter("/sign-in", { replace: true });
      }, 2000);

      return;
    }

    // ถ้ากู้คืน OTP สำเร็จแล้ว ให้หยุดการทำงานของ useEffect นี้ (ไม่ต้องนับถอยหลังต่อ)
    if (isOtpVerified) return;

    // 1. Decode ข้อมูลก่อน
    const decodedData = useDecodecryptQuery(id);

    if (!decodedData) {
      roter("/sign-in", { replace: true });
      return;
    }

    // 2. อัปเดต State ข้อมูลผู้ใช้
    setDataUser(decodedData);

    // 3. เริ่มคำนวณเวลาทันทีจากค่า decodedData ที่เพิ่งได้มา (ไม่รอจาก State dataUser)
    const expiryDate = new Date(decodedData.exp).getTime();
    const now = Date.now();
    const differenceInSeconds = Math.floor((expiryDate - now) / 1000);

    if (differenceInSeconds <= 0) {
      setTimeLeft(0);
      setIsExpired(true);
      return;
    }

    // ตั้งค่าเวลาเริ่มต้น
    setTimeLeft(differenceInSeconds);

    // 4. เริ่ม Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 5. Cleanup function
    return () => clearInterval(timer);
  }, [id, isOtpVerified]); // ใช้ id เป็น dependency หลัก

  // ฟังก์ชันแปลงวินาทีเป็น MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleResendLink = () => {
    setIsLoading(true);
    setMessages("กำลังกลับไปยังหน้าเข้าสู่ระบบ ...");
    setTimeout(() => {
      roter("/sign-in", { replace: true });
    }, 1500);
  };

  // จัดการการพิมพ์ในช่อง OTP
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return; // รับเฉพาะตัวเลข

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // เอาตัวล่าสุดตัวเดียว
    setOtp(newOtp);

    // เลื่อนไปช่องถัดไปถ้ามีการกรอกค่า
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // จัดการการลบ (Backspace)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.some((value) => !value)) {
      showToast.wran("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    if (!executeRecaptcha) {
      showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
      setIsLoading(false);
      return;
    }

    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      showToast.wran("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    try {
      setIsLoading(true);
      setMessages("กำลังตรวจสอบรหัส OTP...");
      const token = await executeRecaptcha("otp_check");
      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        return;
      }

      const payload: PayloadCheckOtpProps = {
        id: dataUser?.id ?? "",
        otp: otpValue,
        exp: dataUser?.exp ?? "",
        recaptchaToken: token,
      };

      const resp = await PutcheckOtp(payload);

      if (!resp.success) {
        setIsLoading(false);
        setTimeout(() => {
          showToast.error(
            resp ? "รหัส OTP ไม่ถูกต้อง" : "เกิดข้อผิดพลาดในการลงทะเบียน",
          );
        }, 1000);
        return;
      }

      setTimeout(async () => {
        setIsLoading(false);
        setMessages("");
        setIsOtpVerified(true);
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);
      showToast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleSavePassword = async () => {
    // 1. Validation เบื้องต้น
    if (newPassword !== confirmPassword) {
      showToast.wran("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!executeRecaptcha) {
      showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
      return;
    }

    try {
      setIsLoading(true);
      setMessages("กำลังตรวจสอบความปลอดภัย...");

      // 2. Execute reCAPTCHA
      const token = await executeRecaptcha("reset_password");
      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        setIsLoading(false); // <--- อย่าลืมปิด Loading
        return;
      }

      setMessages("กำลังบันทึกรหัสผ่านใหม่...");

      const payload: PayloadResetPassword = {
        id: dataUser?.id ?? "",
        email: dataUser?.email ?? "",
        vet_codeId: dataUser?.vet_codeId ?? "",
        password: newPassword,
        recaptchaToken: token,
      };

      const resp = await PostNewPassword(payload);

      if (!resp.success) {
        setIsLoading(false);
        // เช็ค message จาก API โดยตรงจะแม่นยำกว่าการใช้ Ternary แบบเดิม
        showToast.error(resp.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        return;
      }

      // 3. จัดการ UI เมื่อสำเร็จ
      setMessages("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว ✨");

      // หน่วงเวลาให้ User เห็นข้อความความสำเร็จนิดนึงก่อนดีดไปหน้า Login
      setTimeout(() => {
        setIsLoading(false);
        showToast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
        roter("/sign-in", { replace: true });
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      setMessages("");
      showToast.error(
        "เกิดข้อผิดพลาด: " + (error.message || "กรุณาลองใหม่อีกครั้ง"),
      );
    }
  };

  if (isLoading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* การ์ดหลักแบบโมเดิร์น */}
      <div className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-2xl border border-white/50 relative overflow-hidden">
        {/* เอฟเฟกต์พื้นหลัง */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-linear-to-br from-blue-400 to-cyan-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-linear-to-br from-purple-400 to-pink-300 rounded-full opacity-20 blur-3xl"></div>

        {/* หัวข้อ */}
        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl text-white">
                lock_reset
              </span>
            </div>
          </div>

          <h2 className="mb-1 text-center text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Reset Password
          </h2>

          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <span className="material-symbols-outlined text-blue-500 text-lg">
                badge
              </span>
              <p className="text-sm font-medium text-blue-700">
                ID: {dataUser?.vet_codeId}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isExpired ? (
            /* กรณีหมดเวลา - ปรับดีไซน์ */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center relative z-10"
            >
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-5xl text-red-500">
                    timer_off
                  </span>
                </div>
                <div className="text-red-500 font-semibold text-lg">
                  ลิงก์หมดเวลาแล้ว
                </div>
              </div>

              <p className="mb-8 text-gray-600 bg-gray-50 p-4 rounded-xl">
                กรุณากดเพื่อขอรับลิงก์สำหรับรีเซ็ตรหัสผ่านใหม่อีกครั้ง
              </p>

              <button
                onClick={() => handleResendLink()}
                className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 py-3.5 font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">refresh</span>
                  ขอลิงก์ใหม่อีกครั้ง
                </span>
              </button>
            </motion.div>
          ) : !isOtpVerified ? (
            /* ขั้นตอนกรอก OTP - ปรับให้สวยขึ้น */
            <motion.div
              key="otp-stage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative z-10"
            >
              {/* OTP Input Fields */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  กรอกรหัสยืนยัน 6 หลัก
                </label>
                <div className="flex justify-center gap-3">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      ref={(el: any) => (inputRefs.current[index] = el)}
                      value={data}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="h-16 w-14 rounded-2xl border-2 border-gray-200 text-center text-2xl font-bold transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white shadow-sm hover:border-blue-300"
                      style={{
                        boxShadow: data
                          ? "0 4px 6px -1px rgba(0,0,0,0.1)"
                          : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Timer และข้อความแจ้งเตือน */}
              <div className="mb-8 space-y-3">
                <div
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl ${
                    timeLeft < 60 ? "bg-red-50" : "bg-blue-50"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      timeLeft < 60 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {timeLeft < 60 ? "timer_alert" : "timer"}
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      timeLeft < 60 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    รหัสจะหมดอายุใน {formatTime(timeLeft)} นาที
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-xl">
                  <span className="material-symbols-outlined text-orange-500 text-lg">
                    security
                  </span>
                  <p className="text-xs text-orange-600">
                    รหัส OTP ใช้ได้เพียงครั้งเดียว ไม่สามารถนำกลับมาใช้ซ้ำได้
                  </p>
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.some((d) => !d)}
                className={`w-full rounded-xl py-4 font-bold text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                  otp.some((d) => !d)
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : "bg-linear-to-r from-blue-600 to-cyan-600 hover:shadow-xl"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                  ตรวจสอบรหัส OTP
                </span>
              </button>
            </motion.div>
          ) : (
            /* ขั้นตอนตั้งรหัสผ่านใหม่ - ปรับดีไซน์ */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 relative z-10"
            >
              {/* Success Message */}
              <div className="rounded-xl bg-linear-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white">
                      verified
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-green-700">
                      ยืนยัน OTP สำเร็จ
                    </p>
                    <p className="text-xs text-green-600">
                      กรุณาตั้งรหัสผ่านใหม่
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่านใหม่"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-4 pr-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      rule
                    </span>
                    เงื่อนไขรหัสผ่าน:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "อย่างน้อย 8 ตัวอักษร",
                        valid: newPassword.length >= 8,
                      },
                      {
                        label: "ตัวพิมพ์ใหญ่ (A-Z)",
                        valid: /[A-Z]/.test(newPassword),
                      },
                      {
                        label: "ตัวพิมพ์เล็ก (a-z)",
                        valid: /[a-z]/.test(newPassword),
                      },
                      {
                        label: "อักขระพิเศษ (!@#)",
                        valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                      },
                    ].map((req, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`material-symbols-outlined text-sm ${
                            req.valid ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {req.valid
                            ? "check_circle"
                            : "radio_button_unchecked"}
                        </span>
                        <span
                          className={
                            req.valid ? "text-green-700" : "text-gray-500"
                          }
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border p-4 outline-none transition-all bg-white ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-400 focus:ring-4 focus:ring-red-100"
                        : confirmPassword && newPassword === confirmPassword
                          ? "border-green-400 focus:ring-4 focus:ring-green-100"
                          : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    }`}
                  />
                </div>

                {/* Error/Success Message */}
                {confirmPassword && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      newPassword === confirmPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {newPassword === confirmPassword
                        ? "check_circle"
                        : "error"}
                    </span>
                    <span>
                      {newPassword === confirmPassword
                        ? "รหัสผ่านตรงกัน"
                        : "รหัสผ่านไม่ตรงกัน"}
                    </span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePassword}
                disabled={
                  newPassword.length < 8 ||
                  !/[A-Z]/.test(newPassword) ||
                  !/[a-z]/.test(newPassword) ||
                  !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ||
                  newPassword !== confirmPassword
                }
                className={`w-full rounded-xl py-4 font-bold text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                  newPassword &&
                  newPassword === confirmPassword &&
                  newPassword.length >= 8 &&
                  /[A-Z]/.test(newPassword) &&
                  /[a-z]/.test(newPassword) &&
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                    ? "bg-linear-to-r from-green-600 to-emerald-600 hover:shadow-xl"
                    : "bg-gray-300 cursor-not-allowed shadow-none"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">save</span>
                  บันทึกรหัสผ่านใหม่
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
