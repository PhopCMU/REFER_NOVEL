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
              setMessages(result.message || "กเข้าสู่ระบบสำเร็จ");
              setTimeout(() => {
                setLoading(false);
                setMessages("");
                navigate("/novel/dashboard", { replace: true });
              }, 2000);
              break;

            case 4000: // ❌ User registration failed
              // showToast.error(result.message || "การลงทะเบียนผู้ใช้ล้มเหลว");
              // Optional: redirect ไปหน้า signup
              // setAuthMode("signup");
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
              setMessages(result.message || "ระบบยืนยันตัวตนล้มเหลว");
              setTimeout(() => {
                setLoading(false);
                setMessages("");
              }, 1500);
              break;

            case 5000: // ❌ Server error
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

      setMessages("ส่งสำเร็จ! ขอบขอบคุณสำหรับความคิดเห็นของคุณ!");
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
        <div className="w-full max-w-md">
          {/* Toggle Switch */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-full flex">
              <motion.button
                onClick={() => setAuthMode("signin")}
                className={`px-6 py-2 rounded-full relative cursor-pointer ${
                  authMode === "signin" ? "text-white" : "text-gray-600"
                }`}
              >
                {authMode === "signin" && (
                  <motion.span
                    layoutId="authToggle"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full z-0"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full z-0"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <span className="material-symbols-outlined">person_add</span>
                  สมัครสมาชิก
                </span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {authMode === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SignInForm onForgotPassword={() => setAuthMode("forgot")} />
              </motion.div>
            ) : authMode === "signup" ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SignUpForm />
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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
        </div>
        <div className="absolute inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center p-8 text-white"
          >
            {/* Title */}
            <h2 className="text-5xl font-extrabold mb-4 tracking-tight">
              Veterinary Referral CMU
            </h2>

            {/* Subtitle */}
            <p className="text-2xl font-medium mb-6">
              Integrated platform for animal case transfer
            </p>

            {/* Satisfaction Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.5)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 
              text-xl font-semibold shadow-lg hover:shadow-xl
              flex items-center justify-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-2xl">
                contract
              </span>
              <span>ประเมินความพึงพอใจ</span>
            </motion.button>
          </motion.div>
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()} // ป้องกันการคลิกผ่าน modal
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
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow"
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
