import { motion } from "framer-motion";
import { useState } from "react";
import { LoadingForm } from "../../component/LoadingForm";

export const SignInCMUItAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");

  const handleClick = async () => {
    try {
      const clientId = import.meta.env.VITE_PUBLIC_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_PUBLIC_CALLBACK_URL;
      const scope = import.meta.env.VITE_PUBLIC_SCOPE;
      const authUrlBase = import.meta.env.VITE_PUBLIC_AUTH_URL;

      if (!clientId || !redirectUri || !scope || !authUrlBase) {
        setIsLoading(true);
        setMessages("ไม่สามารถเข้าสู่ระบบได้");
        setTimeout(() => {
          setIsLoading(false);
          setMessages("");
        }, 3000);
        return;
      }

      const authUrl = `${authUrlBase}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${encodeURIComponent(scope)}`;

      setIsLoading(true);
      setMessages("กําลังเข้าสู่ระบบ...");

      setTimeout(() => {
        window.location.href = authUrl;
      }, 1500);
    } catch (error) {
      console.error("SignInCMUItAccount error:", error);
      setIsLoading(true);
      setMessages("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setTimeout(() => {
        setIsLoading(false);
        setMessages("");
      }, 3000);
    }
  };

  // ✅ ต้องมี return เพื่อเรนเดอร์ LoadingForm
  if (isLoading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isLoading} // ✅ ป้องกันการคลิกซ้ำขณะโหลด
      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined">badge</span>
      เข้าสู่ระบบด้วย CMU Account
      <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </motion.button>
  );
};
