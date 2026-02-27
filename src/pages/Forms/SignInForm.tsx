import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Input from "../../component/Inputs/Input";
import { showToast } from "../../utils/showToast";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import SearchableSelect from "../../component/Inputs/SearchableSelect";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { GetHospitalsWorkplace } from "../../api/GetApi";
import type { DataFormLoginProps, DataHospitalProps } from "../../types/type";
import { LoadingForm } from "../../component/LoadingForm";
import { PostLogin } from "../../api/PostApi";
import { saveToken } from "../../utils/authUtils";

interface FormErrors {
  email?: string;
  password?: string;
  referralHospital?: string;
}

interface SignInFormProps {
  onForgotPassword: () => void;
}

export default function SignInForm({ onForgotPassword }: SignInFormProps) {
  // === Router === //
  const navigate = useNavigate();
  // === Google Recaptcha === //
  const { executeRecaptcha } = useGoogleReCaptcha();

  // === useState === //
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data_hospital, setData_hospital] = useState<DataHospitalProps[]>([]);

  // === Function ดึงข้อมูลสถานที่ === //
  const useRefDataHopitals = useRef(false);
  useEffect(() => {
    if (useRefDataHopitals.current) return;
    useRefDataHopitals.current = true;
    fetchDataHospitalWorkplace();
  }, []);

  const fetchDataHospitalWorkplace = async () => {
    setIsLoading(true);
    try {
      const resp = await GetHospitalsWorkplace();

      if (!resp.success) {
        showToast.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่");
        setIsLoading(false);
        return;
      }

      setData_hospital(resp.data);
      setIsLoading(false);
    } catch (error) {
      console.log("Error in fetchDataHospitalWorkplace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};

    if (!executeRecaptcha) {
      showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
      return;
    }

    const token = await executeRecaptcha("signin");

    if (!email) {
      newErrors.email = "กรุณากรอกอีเมล";
      showToast.error("กรุณากรอกอีเมล");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
      showToast.error("รูปแบบอีเมลไม่ถูกต้อง");
    }

    if (!password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
      showToast.error("กรุณากรอกรหัสผ่าน");
    } else if (password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
      showToast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    if (!selectedHospital) {
      newErrors.referralHospital = "กรุณาเลือกคลินิกหรือโรงพยาบาลสัตว์";
      showToast.error("กรุณาเลือกคลินิกหรือโรงพยาบาลสัตว์");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: DataFormLoginProps = {
      email,
      password,
      selectedHospital,
      recaptchaToken: token,
    };

    setIsSubmitting(true);
    setErrors({});

    const resp = await PostLogin(payload);

    if (!resp.success) {
      showToast.error(resp);
      setErrors(resp);
      setIsSubmitting(false);
      return;
    }
    saveToken(resp.token);
    setTimeout(() => {
      showToast.success("เข้าสู่ระบบสําเร็จ");
      navigate("/dashboard");
      setIsSubmitting(false);
    }, 2000);
  };

  const handleSubmitVetCmu = () => {
    showToast.info("กำลังเชื่อมต่อกับระบบ CMU Account...");
  };

  // แปลงให้เข้ากับ Select component
  const hospitalOptions = data_hospital.map((item) => ({
    value: item.id, // ใช้ id เป็น value
    label: item.name, // ใช้ hospital เป็น text ที่แสดง
  }));

  if (isLoading) {
    return <LoadingForm text="กำลังโหลดข้อมูล.." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-2"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับ</h2>
        <p className="text-gray-600">เข้าสู่ระบบส่งตัวสัตว์ป่วย</p>
        <p className="text-gray-600 text-xs">
          ศูนย์การเรียนรู้และส่งเสริมสุขภาพทางสัตวแพทย์ภาคเหนือ
        </p>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
      >
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-3">
          <span className="material-symbols-outlined text-blue-600">info</span>
        </div>
        <div>
          <p className="text-xs text-blue-800 font-medium">
            กรุณาใช้อีเมลและรหัสผ่านและคลินิกหรือโรงพยาบาลสัตว์ที่ลงทะเบียนไว้
          </p>
          <p className="text-xs text-blue-600 mt-1">
            หากลืมรหัสผ่านสามารถกดปุ่มลืมรหัสผ่านด้านล่าง
          </p>
        </div>
      </motion.div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="rounded-xl shadow-lg"
        progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
      />

      <div className="space-y-4">
        {/* Email */}
        <Input
          label="อีเมล"
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          icon="mail"
          error={errors.email}
          disabled={isSubmitting}
        />

        {/* Password */}
        <Input
          label="รหัสผ่าน"
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          icon="lock"
          error={errors.password}
          disabled={isSubmitting}
        />

        <SearchableSelect
          label="เลือกคลินิกหรือโรงพยาบาลสัตว์"
          name="referralHospital"
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
          options={hospitalOptions}
          placeholder="พิมพ์เพื่อค้นหาโรงพยาบาล..."
          required
          icon="local_hospital"
          error={errors.referralHospital}
        />

        {/* Forgot Password */}
        <div className="flex justify-end">
          <motion.button
            onClick={onForgotPassword}
            whileHover={{ x: 2 }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined text-sm">help</span>
            ลืมรหัสผ่าน?
          </motion.button>
        </div>

        {/* Standard Sign In Button */}
        <motion.button
          whileHover={
            isSubmitting
              ? {}
              : {
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                }
          }
          whileTap={isSubmitting ? {} : { scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 text-base font-medium transition-all duration-200 ${
            isSubmitting
              ? "bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">login</span>
              เข้าสู่ระบบ
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </>
          )}
        </motion.button>

        {/* Progress Bar */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 4 }}
            className="overflow-hidden rounded-full bg-blue-100"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            ></motion.div>
          </motion.div>
        )}

        {/* Divider */}
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">
            หรือ
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* CMU Vet Section */}
        <motion.div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-800 gap-3 text-sm shadow-sm"
          >
            <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
              <span className="material-symbols-outlined text-indigo-600">
                school
              </span>
            </div>
            <span className="font-medium">
              สำหรับเจ้าหน้าที่ คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่
            </span>
          </motion.div>

          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitVetCmu}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base font-medium transition-all duration-200"
          >
            <span className="material-symbols-outlined">badge</span>
            เข้าสู่ระบบด้วย CMU Account
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </motion.button>
        </motion.div>

        {/* External Vet Section */}
        {/* <motion.div className="space-y-3 mt-4">
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 gap-3 text-sm shadow-sm"
          >
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <span className="material-symbols-outlined text-blue-600">
                business
              </span>
            </div>
            <span className="font-medium">
              สำหรับสัตวแพทย์ โรงพยาบาลสัตว์หรือคลินิกภายนอก
            </span>
          </motion.div>
        </motion.div> */}
      </div>
    </div>
  );
}
