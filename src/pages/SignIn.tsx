import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import images from "../constants/image";
import SignInForm from "./Forms/SignInForm";
import SignUpForm from "./Forms/SignUpForm";
import ForgotPassword from "./Forms/ForgotPassword";
import { showToast } from "../utils/showToast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import type { FeedbackProps } from "../types/type";
import { PostFeedback } from "../api/PostApi";
import { LoadingForm } from "../component/LoadingForm";
import { useNavigate } from "react-router-dom";
import {
  exchangeCodeForSession,
  isAuthenticatedLocally,
} from "../utils/authUtils";
import file from "../constants/file";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      showToast.error("กรุณาใส่คะแนน");
      return;
    }

    if (!executeRecaptcha) {
      showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
      return;
    }

    setLoading(true);
    setMessages("กําลังส่งความคิดเห็น...");
    try {
      const token = await executeRecaptcha("feedback");
      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        return;
      }

      const payload: FeedbackProps = {
        rating,
        comment,
        recaptchaToken: token,
      };

      const resp = await PostFeedback(payload);

      if (!resp) {
        setMessages("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
        setTimeout(() => {
          setLoading(false);
          setMessages("");
        }, 1200);
        return;
      }

      setMessages("ส่งสำเร็จ! ขอบคุณสำหรับความคิดเห็นของคุณ!");
      setTimeout(() => {
        setIsModalOpen(false);
        setLoading(false);
        setMessages("");
        setRating(null);
        setComment("");
      }, 2000);
    } catch (error) {
      setMessages("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
      setTimeout(() => {
        setLoading(false);
        setMessages("");
      }, 1500);
    }
  };

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
      {/* Modal: Satisfaction Feedback */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                ประเมินความพึงพอใจ
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                กรุณาให้คะแนนการใช้งานระบบของคุณ
              </p>

              <form onSubmit={handleSubmitFeedback}>
                {/* Rating Stars */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`text-4xl transition-all duration-200 ${
                        rating && star <= rating
                          ? "text-yellow-400 scale-110"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Comment Field */}
                <div className="mb-6">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ความคิดเห็น (ถ้ามี)
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="เช่น ระบบใช้งานง่าย แต่ต้องการปรับปรุงหน้าจอ..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!rating}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition ${
                      rating
                        ? "bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    ส่งข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
