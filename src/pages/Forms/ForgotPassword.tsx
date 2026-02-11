import { motion } from "framer-motion";
import { useState } from "react";
import Input from "../../component/Inputs/Input";
import { showToast } from "../../utils/showToast";
import { ToastContainer } from "react-toastify";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

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

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async () => {
    // 1. รีเซ็ต error
    setErrors({});

    const newErrors: FormErrors = {};

    // 2. ตรวจสอบข้อมูลแบบฟอร์ม
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    // 3. ถ้ามี error แสดง toast และไม่ดำเนินการต่อ
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Object.values(newErrors).forEach((err) => showToast.error(err));
      return;
    }

    try {
      // 4. ตรวจสอบ reCAPTCHA
      if (!executeRecaptcha) {
        showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
        return;
      }

      const token = await executeRecaptcha("forgot_password"); // action ควรตรงกับ backend

      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        return;
      }

      // 5. ส่งข้อมูลไปยัง API จริง
      const res = await fetch("/api/forgot-password", {
        // ✅ แก้จาก /api/signup เป็น /api/forgot-password
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, recaptchaToken: token }),
      });

      // 6. ตรวจสอบสถานะการตอบกลับ
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "รีเซ็ตไม่สำเร็จ" }));
        const errorMsg =
          errorData.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน";
        showToast.error(errorMsg);
        return;
      }

      // 7. ถ้าสำเร็จ
      setIsSubmitted(true);
      showToast.success("ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว");
    } catch (error) {
      console.error("Error during forgot password submission:", error);
      showToast.error("เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-6 bg-green-50 rounded-lg border border-green-200 text-green-800"
        >
          <span className="material-symbols-outlined text-4xl mb-2 text-green-500">
            check_circle
          </span>
          <h3 className="font-medium mb-1">ส่งคำขอรีเซ็ตรหัสผ่านสำเร็จ!</h3>
          <p className="text-sm mb-4">
            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
            กรุณาตรวจสอบกล่องจดหมาย
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSubmitted(false)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm"
          >
            ตกลง
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Email Input */}
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

          {/* Submit Button */}
          <motion.button
            type="button" // ✅ แนะนำให้ใช้ type="button" เพื่อป้องกันการ submit แบบ default
            whileHover={{
              scale: 1.02,
              boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)",
              background: "linear-gradient(to right, #2563eb, #0284c7)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">send</span>
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </motion.button>

          {/* Back to Sign In */}
          <div className="flex justify-center pt-2">
            <motion.button
              onClick={onBackToSignIn}
              whileHover={{ x: 2 }}
              className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-1"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              กลับไปหน้าเข้าสู่ระบบ
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
