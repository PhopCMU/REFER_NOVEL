import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getUserFromToken } from "../../../utils/authUtils";
import { useNavigate } from "react-router-dom";
import { GetHospitalsWorkplace } from "../../../api/GetApi";
import {
  PostAddUpdateWorksplaceVet,
  PostAddWorksplace,
} from "../../../api/PostApi";
import { showToast } from "../../../utils/showToast";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { LoadingForm } from "../../../component/LoadingForm";
import SearchableSelect from "../../../component/Inputs/SearchableSelect";
import { ToastContainer } from "react-toastify";
import type { DataHospitalProps, WorkplacePayload } from "../../../types/type";
import {
  Building2,
  Building,
  Hospital,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Info,
  Search,
  Save,
  ListChecks,
  MapPin,
  Trash2,
} from "lucide-react";

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
    if (myWorkplaces.length < 1) {
      setMyWorkplaces([...myWorkplaces, ""]);
    } else {
      showToast.info("เพิ่มได้สูงสุด 1 แห่ง");
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

    try {
      const payload: any = {
        a: myWorkplaces,
      };

      const resp = await PostAddUpdateWorksplaceVet(payload);
      if (resp && resp.success) {
        showToast.success("บันทึกสถานที่ทำงานเรียบร้อย");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกสถานที่ทำงาน: " + resp);
        setTimeout(() => {
          setError("");
        }, 5000);
      }
    } catch (error) {
      console.error("Error saving workplaces:", error);
      showToast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
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
    <div className="p-8 w-full mx-auto ">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        toastStyle={{ borderRadius: "16px" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              จัดการสถานที่ทำงาน
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              จัดการสถานที่ทำงานหลักและสถานที่ทำงานเพิ่มเติมของคุณ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-5 space-y-6">
          {/* Current Workplace */}
          <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Building className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">
                สถานที่ทำงานปัจจุบัน
              </h2>
            </div>

            {userLogin?.hospitalId ? (
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl" />
                <div className="relative p-5 bg-linear-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-200/50 flex items-center justify-between group hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-200 group-hover:scale-110 transition-transform duration-300">
                      <Hospital className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {data_hospital.find(
                          (h) => h.id === userLogin.hospitalId,
                        )?.name || "กำลังโหลดข้อมูล..."}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                        <p className="text-xs text-blue-600 font-medium">
                          สถานที่ทำงานหลัก
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      กำลังใช้งาน
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">ไม่พบข้อมูลสถานที่ทำงาน</p>
              </div>
            )}
          </div>

          {/* Add Workplace Button */}
          <div>
            <motion.button
              onClick={() => setAddWorkloction(!addWorkloction)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                addWorkloction
                  ? "bg-white text-red-500 border-2 border-red-200 hover:bg-red-50/50"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200"
              }`}
            >
              {addWorkloction ? (
                <>
                  <X className="w-5 h-5" />
                  ยกเลิก
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  เพิ่มสถานที่ทำงานใหม่เข้าระบบ
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-gray-500">
              <Info className="w-4 h-4 text-gray-400" />
              <span>
                หากไม่พบสถานที่ทำงานของคุณในระบบ สามารถเพิ่มข้อมูลใหม่ได้ที่นี่
              </span>
            </div>

            <AnimatePresence>
              {addWorkloction && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <div className="p-6 bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-blue-100/50 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">
                          ประเภทสถานที่
                        </label>
                        <select
                          value={formDataWorkplace.type}
                          onChange={(e) =>
                            handleChangeWorkplace("type", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm text-gray-700"
                        >
                          <option value="hospital" className="py-2">
                            โรงพยาบาลสัตว์
                          </option>
                          <option value="clinic" className="py-2">
                            คลินิก
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2 relative" ref={inputRef}>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">
                          ชื่อสถานที่
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formDataWorkplace.name}
                            onChange={(e) =>
                              handleChangeWorkplace("name", e.target.value)
                            }
                            placeholder="เช่น เชียงใหม่สัตวแพทย์"
                            className={`w-full px-4 py-3 bg-white border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm ${
                              error
                                ? "border-red-300 bg-red-50/50"
                                : "border-gray-200"
                            }`}
                          />
                          {formDataWorkplace.name && (
                            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        {error && (
                          <p className="text-xs text-red-500 mt-1.5 ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                          </p>
                        )}

                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            {suggestions.map((item) => (
                              <div
                                key={item.id}
                                onClick={() =>
                                  handleSelectSuggestion(item.name)
                                }
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-100 flex items-center justify-between group transition-colors"
                              >
                                <span className="text-sm text-gray-700 group-hover:text-blue-600">
                                  {item.name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                  {item.type === "hospital"
                                    ? "รพ.สัตว์"
                                    : "คลินิก"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleAddWorkplace}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      บันทึกเข้าระบบ
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - My Additional Workplaces */}
        <div className="col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <ListChecks className="w-5 h-5 text-indigo-700" />
                </div>
                <h2 className="text-base font-semibold text-gray-800">
                  สถานที่ทำงานเพิ่มเติม
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  {myWorkplaces.length}/1 แห่ง
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {myWorkplaces.length === 0 ? (
                <div className="py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    ยังไม่มีสถานที่ทำงานเพิ่มเติม
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    กดปุ่มเพิ่มเพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                myWorkplaces.map((workplace, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                        icon={Hospital}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMyWorkplace(index)}
                      className="mb-1 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}

              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

              <div className="flex gap-3 pt-4">
                {myWorkplaces.length === 0 && (
                  <motion.button
                    type="button"
                    onClick={addMyWorkplace}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-indigo-200/50"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มช่อง
                  </motion.button>
                )}

                {myWorkplaces.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={handleSaveWorkplaces}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-md shadow-indigo-200 hover:shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
