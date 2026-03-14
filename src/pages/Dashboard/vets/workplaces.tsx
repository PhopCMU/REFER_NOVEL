import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getUserFromToken } from "../../../utils/authUtils";
import { useNavigate } from "react-router-dom";
import { GetHospitalsWorkplace } from "../../../api/GetApi";
import { PostAddWorksplace } from "../../../api/PostApi";
import { showToast } from "../../../utils/showToast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { LoadingForm } from "../../../component/LoadingForm";
import SearchableSelect from "../../../component/Inputs/SearchableSelect";
import { ToastContainer } from "react-toastify";
import type { DataHospitalProps, WorkplacePayload } from "../../../types/type";

type Workplace = {
  type?: "hospital" | "clinic";
  name: string;
};

export default function Workplaces() {
  const userLogin = getUserFromToken();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // === State ===
  const [data_hospital, setData_hospital] = useState<DataHospitalProps[]>([]);
  const [suggestions, setSuggestions] = useState<DataHospitalProps[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");
  const [addWorkloction, setAddWorkloction] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [formDataWorkplace, setFormDataWorkplace] = useState<Workplace>({
    type: "hospital",
    name: "",
  });

  const inputRef = useRef<HTMLDivElement>(null);

  const [myWorkplaces, setMyWorkplaces] = useState<string[]>([]);

  useEffect(() => {
    // ✅ Redirect if not authenticated or not a vet
    if (!userLogin || userLogin.aud !== "vet") {
      navigate("/novel/dashboard", { replace: true });
    } else if (userLogin.workplaces) {
      // Initialize with existing workplaces if available in token
      setMyWorkplaces(userLogin.workplaces);
    }
  }, [userLogin, navigate]);

  // === Logic for My Workplaces ===
  const addMyWorkplace = () => {
    if (myWorkplaces.length < 10) {
      setMyWorkplaces([...myWorkplaces, ""]);
    } else {
      showToast.info("เพิ่มได้สูงสุด 10 แห่ง");
    }
  };

  const removeMyWorkplace = (index: number) => {
    const updated = myWorkplaces.filter((_, i) => i !== index);
    setMyWorkplaces(updated);
  };

  const handleMyWorkplaceChange = (index: number, value: string) => {
    const updated = [...myWorkplaces];
    updated[index] = value;
    setMyWorkplaces(updated);
  };

  const handleSaveWorkplaces = async () => {
    // Check for empty values
    if (myWorkplaces.some((wp) => !wp.trim())) {
      showToast.error("กรุณาระบุสถานที่ทำงานให้ครบถ้วน");
      return;
    }

    // TODO: Implement API call to update vet profile
    showToast.info("กำลังพัฒนาส่วนการบันทึกข้อมูลลงในโปรไฟล์");
    console.log("Saving workplaces:", myWorkplaces);
  };

  // === Fetch Data ===
  useEffect(() => {
    fetchDataHospitalWorkplace();
  }, []);

  const fetchDataHospitalWorkplace = async () => {
    setIsLoading(true);
    setMessages("กำลังโหลดข้อมูล...");
    try {
      const resp = await GetHospitalsWorkplace();
      if (resp && resp.success) {
        setData_hospital(resp.data);
      } else {
        showToast.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่");
      }
    } catch (err) {
      console.error("Error in fetchDataHospitalWorkplace:", err);
    } finally {
      setIsLoading(false);
      setMessages("");
    }
  };

  // === Logic Helpers ===
  const sanitizeInputName = (text: string): string => {
    return text
      .replace(/โรงพยาบาลสัตว์\s*/gi, "")
      .replace(/โรงพยาบาล\s*/gi, "")
      .replace(/คลินิก\s*/gi, "")
      .replace(/\s+/g, "")
      .trim();
  };

  const isThaiOnly = (text: string): boolean => {
    const thaiRegex = /^[\u0E00-\u0E7F\s\d.,()\-/]+$/;
    return thaiRegex.test(text.trim()) && text.trim() !== "";
  };

  const isHospitalExists = (hospitalName: string): boolean => {
    return data_hospital.some((item) => item.name === hospitalName.trim());
  };

  const filterHospitals = (query: string) => {
    if (!query.trim()) return [];
    return data_hospital
      .map((item) => {
        const label =
          item.type === "hospital"
            ? `โรงพยาบาลสัตว์ ${item.name}`
            : `คลินิก ${item.name}`;
        return { ...item, label };
      })
      .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      .map(({ label, ...item }) => item);
  };

  const handleChangeWorkplace = (field: "type" | "name", value: string) => {
    if (field === "name") {
      setFormDataWorkplace((prev) => ({ ...prev, name: value }));
      if (error) setError("");

      if (formDataWorkplace.type === "hospital" && value.trim()) {
        const filtered = filterHospitals(value);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setFormDataWorkplace((prev) => ({
        ...prev,
        type: value as "hospital" | "clinic",
        name: "",
      }));
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (hospitalName: string) => {
    const cleanedName = sanitizeInputName(hospitalName);
    setFormDataWorkplace((prev) => ({ ...prev, name: cleanedName }));
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");
  };

  const validateWorkplace = (): boolean => {
    const cleanedName = sanitizeInputName(formDataWorkplace.name);
    if (!cleanedName.trim()) {
      setError("กรุณากรอกชื่อสถานที่");
      return false;
    }
    if (!isThaiOnly(cleanedName)) {
      setError("กรุณากรอกเป็นภาษาไทยเท่านั้น");
      return false;
    }
    if (
      formDataWorkplace.type === "hospital" &&
      isHospitalExists(cleanedName)
    ) {
      setError("ข้อมูลนี้มีอยู่แล้วในระบบ");
      return false;
    }
    return true;
  };

  const handleAddWorkplace = async () => {
    if (!validateWorkplace()) return;
    if (!executeRecaptcha) {
      showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
      return;
    }

    try {
      setIsLoading(true);
      setMessages("กำลังเพิ่มข้อมูล...");
      const token = await executeRecaptcha("hospital_workplace");
      if (!token) {
        showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
        setIsLoading(false);
        return;
      }

      const cleanedName = sanitizeInputName(formDataWorkplace.name);
      const payload: WorkplacePayload = {
        name: cleanedName,
        type: formDataWorkplace.type as "hospital" | "clinic",
        recaptchaToken: token,
      };

      const resp = await PostAddWorksplace(payload);
      if (resp && resp.success) {
        showToast.success(`เพิ่ม "${cleanedName}" สำเร็จ!`);
        setFormDataWorkplace({ type: "hospital", name: "" });
        setAddWorkloction(false);
        await fetchDataHospitalWorkplace();
      } else {
        showToast.error(resp?.message || "เกิดข้อผิดพลาดในการเพิ่มสถานที่");
      }
    } catch (err) {
      showToast.error("เกิดข้อผิดพลาดในการเพิ่มสถานที่");
    } finally {
      setIsLoading(false);
      setMessages("");
    }
  };

  // Convert for SearchableSelect
  const hospitalOptions = data_hospital.map((item) => ({
    value: item.id,
    label:
      item.type === "hospital"
        ? `โรงพยาบาลสัตว์ ${item.name}`
        : `คลินิก ${item.name}`,
    type: item.type,
  }));

  if (isLoading) return <LoadingForm text={messages} />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        toastStyle={{ borderRadius: "12px" }}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการสถานที่ทำงาน</h1>
      </div>

      {/* Current Workplace */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">
            business_center
          </span>
          สถานที่ทำงานปัจจุบัน
        </h2>
        {userLogin?.hospitalId ? (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                <span className="material-symbols-outlined">local_hospital</span>
              </div>
              <div>
                <p className="font-bold text-blue-900">
                  {data_hospital.find((h) => h.id === userLogin.hospitalId)
                    ?.name || "กำลังโหลดข้อมูล..."}
                </p>
                <p className="text-xs text-blue-600">สถานที่ทำงานหลัก</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              กำลังใช้งาน
            </span>
          </div>
        ) : (
          <p className="text-gray-500 italic">ไม่พบข้อมูลสถานที่ทำงาน</p>
        )}
      </div>

      {/* Add Workplace Button */}
      <div className="mb-6">
        <motion.button
          onClick={() => setAddWorkloction(!addWorkloction)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            addWorkloction
              ? "bg-white text-red-500 border-2 border-red-100"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          }`}
        >
          <span className="material-symbols-outlined">
            {addWorkloction ? "close" : "add_business"}
          </span>
          {addWorkloction ? "ยกเลิก" : "เพิ่มสถานที่ทำงานใหม่เข้าระบบ"}
        </motion.button>

        <p className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-base">info</span>
          หากไม่พบสถานที่ทำงานของคุณในระบบ สามารถเพิ่มข้อมูลใหม่ได้ที่นี่
        </p>

        <AnimatePresence>
          {addWorkloction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-blue-50 space-y-4 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      ประเภทสถานที่
                    </label>
                    <select
                      value={formDataWorkplace.type}
                      onChange={(e) =>
                        handleChangeWorkplace("type", e.target.value)
                      }
                      className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-medium text-gray-700 shadow-sm"
                    >
                      <option value="hospital">โรงพยาบาลสัตว์</option>
                      <option value="clinic">คลินิก</option>
                    </select>
                  </div>

                  <div className="space-y-2 relative" ref={inputRef}>
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      ชื่อสถานที่ (ไม่ต้องมีคำนำหน้า)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formDataWorkplace.name}
                        onChange={(e) =>
                          handleChangeWorkplace("name", e.target.value)
                        }
                        placeholder="เช่น เชียงใหม่สัตวแพทย์"
                        className={`w-full p-3 bg-white border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-medium shadow-sm ${
                          error ? "border-red-200" : "border-gray-100"
                        }`}
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
                          {suggestions.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectSuggestion(item.name)}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-50 flex items-center justify-between group"
                            >
                              <span className="font-medium text-gray-700 group-hover:text-blue-600">
                                {item.name}
                              </span>
                              <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-400">
                                {item.type === "hospital" ? "รพส." : "คลินิก"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddWorkplace}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-md shadow-green-200 transition-all"
                >
                  บันทึกเข้าระบบ
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manage My Additional Workplaces */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">
              list_alt
            </span>
            รายการสถานที่ทำงานเพิ่มเติมของคุณ
          </h2>
          <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg">
            {myWorkplaces.length}/10 แห่ง
          </span>
        </div>

        <div className="space-y-4">
          {myWorkplaces.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
                add_location_alt
              </span>
              <p className="text-sm text-gray-400">ยังไม่มีสถานที่ทำงานเพิ่มเติม</p>
            </div>
          ) : (
            myWorkplaces.map((workplace, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-end gap-3 group"
              >
                <div className="flex-1">
                  <SearchableSelect
                    label={`สถานที่ที่ ${index + 1}`}
                    id={`workplace-${index}`}
                    name={`workplace-${index}`}
                    value={workplace}
                    onChange={(e) =>
                      handleMyWorkplaceChange(index, e.target.value)
                    }
                    options={hospitalOptions}
                    placeholder="ค้นหาสถานที่..."
                    icon="local_hospital"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMyWorkplace(index)}
                  className="mb-1 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </motion.div>
            ))
          )}

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={addMyWorkplace}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-indigo-100"
            >
              <span className="material-symbols-outlined">add</span>
              เพิ่มช่องสถานที่ทำงาน
            </motion.button>

            {myWorkplaces.length > 0 && (
              <motion.button
                type="button"
                onClick={handleSaveWorkplaces}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                <span className="material-symbols-outlined">save</span>
                บันทึกการเปลี่ยนแปลง
              </motion.button>
            )}
          </div>

          <p className="text-xs text-gray-400 italic mt-4 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">info</span>
            * การเปลี่ยนหรือเพิ่มสถานที่ทำงานหลักต้องได้รับการอนุมัติจากผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}
