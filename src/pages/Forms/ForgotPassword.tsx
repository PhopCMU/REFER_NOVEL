import { motion } from "framer-motion";
import { useState, useEffect } from "react"; // เพิ่ม useEffect
import Input from "../../component/Inputs/Input";
import { showToast } from "../../utils/showToast";
import { ToastContainer } from "react-toastify";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { LoadingForm } from "../../component/LoadingForm";
import type { PayloadSendLinkResetPassword } from "../../types/type";
import { PostLinkResetPassword } from "../../api/PostApi";

interface FormErrors {
  email?: string;
}

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
}

export default function ForgotPasswordForm({
  onBackToSignIn,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");

  // --- ระบบนับเวลาถอยหลัง ---
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canResend && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [canResend, countdown]);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(30); // ตั้งค่า 30 วินาที
  };
  // -----------------------

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async () => {
    if (!canResend) return; // ป้องกันการกดผ่าน function ถ้ายังไม่ครบเวลา

    setErrors({});
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Object.values(newErrors).forEach((err) => showToast.error(err));
      return;
    }

    try {
      setIsLoading(true);
      setMessages("กำลังส่งลิงค์รีเซ็ตรหัสผ่าน...");
      if (!executeRecaptcha) {
        showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
        setIsLoading(false);
        return;
      }

      const token = await executeRecaptcha("forgot_password");
      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        setIsLoading(false);
        return;
      }

      const payload: PayloadSendLinkResetPassword = {
        email: email,
        recaptchaToken: token,
      };

      const resp = await PostLinkResetPassword(payload);

      if (!resp.success) {
        setIsLoading(false);
        setTimeout(() => {
          showToast.error(resp ? resp : "เกิดข้อผิดพลาดในการลงทะเบียน");
        }, 1000);

        return;
      }

      setTimeout(() => {
        setIsSubmitted(true);
        setIsLoading(false);
        setMessages("");
        startCountdown();
      }, 1500);
    } catch (error) {
      console.error("Error during forgot password submission:", error);
      showToast.error("เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (isLoading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 text-blue-800"
      >
        <span className="material-symbols-outlined mr-2">info</span>
        <p className="text-sm">
          กรุณากรอกอีเมลที่ลงทะเบียนไว้เพื่อรับลิงก์รีเซ็ตรหัสผ่าน
        </p>
      </motion.div>

      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-green-50 rounded-lg border border-green-200 text-green-800"
        >
          <span className="material-symbols-outlined text-4xl mb-2 text-green-500">
            check_circle
          </span>
          <h3 className="font-medium mb-1">ส่งคำขอสำเร็จ!</h3>
          <p className="text-sm mb-4 text-gray-600">
            เราส่งลิงก์ไปที่ <span className="font-bold">{email}</span> แล้ว{" "}
            <br />
            หากไม่ได้รับ กรุณารอเวลาเพื่อส่งใหม่อีกครั้ง
          </p>

          <motion.button
            whileHover={canResend ? { scale: 1.02 } : {}}
            whileTap={canResend ? { scale: 0.98 } : {}}
            onClick={() => {
              if (canResend) setIsSubmitted(false);
            }}
            disabled={!canResend}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              canResend
                ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {canResend ? "ลองส่งใหม่อีกครั้ง" : `ส่งใหม่ได้ใน (${countdown}s)`}
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            icon="mail"
            error={errors.email}
          />

          <motion.button
            type="button"
            whileHover={
              canResend
                ? {
                    scale: 1.02,
                    boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)",
                    background: "linear-gradient(to right, #2563eb, #0284c7)",
                  }
                : {}
            }
            whileTap={canResend ? { scale: 0.98 } : {}}
            onClick={handleSubmit}
            disabled={!canResend}
            className={`w-full py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold transition-all ${
              canResend
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="material-symbols-outlined">
              {canResend ? "send" : "schedule"}
            </span>
            {canResend
              ? "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              : `กรุณารอ ${countdown} วินาที`}
          </motion.button>

          <div className="flex justify-center pt-2">
            <motion.button
              onClick={onBackToSignIn}
              whileHover={{ x: -2 }}
              className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              กลับไปหน้าเข้าสู่ระบบ
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
