import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import images from "../constants/image";
import SignInForm from "./Forms/SignInForm";
import SignUpForm from "./Forms/SignUpForm";
import ForgotPassword from "./Forms/ForgotPassword";
import { showToast } from "../utils/showToast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { LoadingForm } from "../component/LoadingForm";
import SatisfactionModal from "../component/SatisfactionModal";
import { useNavigate } from "react-router-dom";
import {
  exchangeCodeForSession,
  isAuthenticatedLocally,
} from "../utils/authUtils";
import file from "../constants/file";
import { useFeedbackSubmission } from "../hook/useFeedbackSubmission";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [messages, setMessages] = useState<string>("");
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  // === Router === //
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const code = query.get("code");
  const hasExchangedCode = useRef(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { isSubmitting, submitFeedback } = useFeedbackSubmission();

  useEffect(() => {
    if (executeRecaptcha) {
      setRecaptchaReady(true);
    }
  }, [executeRecaptcha]);

  // ✅ Auto-login ถ้ามี session ที่ยังไม่หมดอายุ
  useEffect(() => {
    if (isAuthenticatedLocally()) {
      navigate("/novel/dashboard", { replace: true });
      return;
    }

    // ✅ Handle code exchange with proper error handling
    if (code && !hasExchangedCode.current) {
      hasExchangedCode.current = true;

      const handleCodeExchange = async () => {
        setIsExchangingCode(true);
        try {
          const result = await exchangeCodeForSession(code);

          // ✅ ตรวจสอบ status และแสดงข้อความตามกรณี
          switch (result.status) {
            case 200: // ✅ สำเร็จ
              setLoading(true);
              setMessages(result.message || "เข้าสู่ระบบสำเร็จ");
              setTimeout(() => {
                setLoading(false);
                setMessages("");
                navigate("/novel/dashboard", { replace: true });
              }, 2000);
              break;

            case 4000: // ❌ User registration failed
              setLoading(true);
              setMessages(result.message || "การลงทะเบียนผู้ใช้ล้มเหลว");
              setTimeout(() => {
                setLoading(false);
                setMessages("");
              }, 1500);
              break;

            case 4001: // ❌ ไม่พบ CMU IT Account
              setLoading(true);
              setMessages(
                result.message ||
                  "ไม่พบข้อมูลบัญชี CMU IT Account ของคุณในระบบ",
              );
              setTimeout(() => {
                setLoading(false);
                setMessages("");
              }, 1500);
              break;

            case 4002: // ❌ ระบบยืนยันตัวตนล้มเหลว
              setLoading(true);
              setMessages(result.message || "ระบบยืนยันตัวตนล้มเหลว");
              setTimeout(() => {
                setLoading(false);
                setMessages("");
              }, 1500);
              break;

            case 5000: // ❌ Server error
              setLoading(true);
              setMessages(
                result.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
              );
              setTimeout(() => {
                setLoading(false);
                setMessages("");
              }, 1500);
              break;
            default:
              if (!result.success) {
                showToast.error(
                  result.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
                );
              }
          }
        } catch (error) {
          console.error("Error in handleCodeExchange:", error);
          showToast.error("เกิดข้อผิดพลาดในการประมวลผล");
        } finally {
          setIsExchangingCode(false);
        }
      };

      handleCodeExchange();
    }
  }, [code, navigate]);

  if (!recaptchaReady || isExchangingCode) {
    return (
      <LoadingForm
        text={
          isExchangingCode
            ? "กำลังเข้าสู่ระบบด้วย CMU Account..."
            : "กำลังโหลด reCAPTCHA..."
        }
      />
    );
  }

  if (loading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full ">
          {/* Role Header */}
          <div className="text-center mb-5">
            <p className="text-xs text-gray-400">
              ระบบบริหารจัดการการส่งต่อผู้ป่วยสัตว์ — Referral NOVEL v
              {__APP_VERSION__}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex flex-col items-center mb-6 gap-2">
            <div className="bg-gray-100 p-1 rounded-full flex shadow-inner">
              <motion.button
                onClick={() => setAuthMode("signin")}
                className={`px-6 py-2 rounded-full relative cursor-pointer ${
                  authMode === "signin" ? "text-white" : "text-gray-600"
                }`}
              >
                {authMode === "signin" && (
                  <motion.span
                    layoutId="authToggle"
                    className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full z-0"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <span className="material-symbols-outlined">login</span>
                  เข้าสู่ระบบ
                </span>
              </motion.button>
              <motion.button
                onClick={() => setAuthMode("signup")}
                className={`px-6 py-2 rounded-full relative cursor-pointer ${
                  authMode === "signup" ? "text-white" : "text-gray-600"
                }`}
              >
                {authMode === "signup" && (
                  <motion.span
                    layoutId="authToggle"
                    className="absolute inset-0 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full z-0"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <span className="material-symbols-outlined">person_add</span>
                  สมัครสมาชิก
                </span>
              </motion.button>
            </div>
            <p className="text-xs text-gray-400">
              {authMode === "signin"
                ? "มีบัญชีอยู่แล้ว — เข้าสู่ระบบเพื่อส่งตัวสัตว์ป่วย"
                : authMode === "signup"
                  ? "สมัครสมาชิกใหม่ — สำหรับสัตวแพทย์ที่ต้องการส่งตัวสัตว์ป่วย"
                  : "รีเซ็ตรหัสผ่านของคุณ"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {authMode === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SignInForm onForgotPassword={() => setAuthMode("forgot")} />
              </motion.div>
            ) : authMode === "signup" ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SignUpForm />
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPassword onBackToSignIn={() => setAuthMode("signin")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Right Side - Banner */}
      <div className="hidden md:flex md:w-1/2 bg-gray-100 relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={images.bg_novel}
            alt="Background"
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/60 to-indigo-900/70" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white w-full">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/50 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
              <span className="material-symbols-outlined text-4xl text-white">
                pet_supplies
              </span>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold mb-3 tracking-tight">
              Referral NOVEL
            </h2>

            {/* Banner message for pet owners */}
            <div className="mb-4">
              <div className="bg-blue-500/50 border-2 border-blue-700 backdrop-blur-md rounded-xl p-5 ">
                <p className="text-white/80  max-w-lg mx-auto leading-relaxed">
                  สำหรับเจ้าของสัตว์: ที่ต้องการส่งตัวสัตวเลี้ยงเพื่อมารักษาต่อ
                  ให้ประสานสัตวแพทย์แต่ละแห่ง ที่สัตว์เลี้ยงท่านทำการรักษาอยู่
                  ขอบคุณครับ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* For Veterinarians */}
              <div className="group/card bg-white/3 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-blue-400/40 hover:bg-white/8 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-xl group-hover/card:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-blue-300 text-xl">
                      stethoscope
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    สัตวแพทย์
                  </h3>
                </div>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() =>
                        window.open(
                          window.location.origin + file.manualsystem,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-3 py-2 text-sm text-white/60 hover:text-white w-full text-left transition-all group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-blue-500/40 transition-colors">
                        <span className="material-symbols-outlined text-lg text-white/50 group-hover/btn:text-white">
                          menu_book
                        </span>
                      </div>
                      <span className="flex-1 font-medium">
                        คู่มือการใช้งานระบบ
                      </span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all">
                        north_east
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        window.open(
                          window.location.origin + file.manualresetpassword,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-3 py-2 text-sm text-white/60 hover:text-white w-full text-left transition-all group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-blue-500/40 transition-colors">
                        <span className="material-symbols-outlined text-lg text-white/50 group-hover/btn:text-white">
                          lock_reset
                        </span>
                      </div>
                      <span className="flex-1 font-medium">
                        คู่มือการรีเซ็ตรหัสผ่าน
                      </span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all">
                        north_east
                      </span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* For Staff */}
              <div className="group/card bg-white/3 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-purple-400/40 hover:bg-white/8 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-xl group-hover/card:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-purple-300 text-xl">
                      badge
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    เจ้าหน้าที่
                  </h3>
                </div>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() =>
                        window.open(
                          window.location.origin + file.manualstaff,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-3 py-2 text-sm text-white/60 hover:text-white w-full text-left transition-all group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-purple-500/40 transition-colors">
                        <span className="material-symbols-outlined text-lg text-white/50 group-hover/btn:text-white">
                          menu_book
                        </span>
                      </div>
                      <span className="flex-1 font-medium">
                        คู่มือการใช้งานระบบ
                      </span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all">
                        north_east
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        window.open(window.location.origin + file.sop, "_blank")
                      }
                      className="flex items-center gap-3 py-2 text-sm text-white/60 hover:text-white w-full text-left transition-all group/btn"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-purple-500/40 transition-colors">
                        <span className="material-symbols-outlined text-lg text-white/50 group-hover/btn:text-white">
                          description
                        </span>
                      </div>
                      <span className="flex-1 font-medium">SOP</span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all">
                        north_east
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Satisfaction Section - Prominent Card */}
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full relative overflow-hidden rounded-2xl border-2 border-yellow-400/60 bg-linear-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm p-4 group shadow-lg shadow-yellow-900/20 cursor-pointer"
            >
              {/* Pulse ring - simplified */}
              <div className="absolute -inset-0.5 rounded-2xl border-2 border-yellow-400/20 pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 bg-yellow-400/20 border border-yellow-400/50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-yellow-300 text-2xl">
                    star
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-base">
                    ประเมินความพึงพอใจ
                  </p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="text-yellow-400 text-base leading-none"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-yellow-200/70 text-xs mt-1">
                    แบ่งปันความคิดเห็นของคุณ
                  </p>
                </div>
                <span className="material-symbols-outlined text-yellow-300 group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </div>
            </motion.button>

            {/* Footer Text */}
            <p className=" text-white mt-6">
              ศูนย์การเรียนรู้และส่งเสริมสุขภาพทางสัตวแพทย์ภาคเหนือ
            </p>
          </div>
        </div>
      </div>
      <SatisfactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitFeedback}
        submitting={isSubmitting}
      />
    </div>
  );
}
