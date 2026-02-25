import { useEffect, useMemo, useRef, useState } from "react";
import { getUserFromToken } from "../../../utils/authUtils";
import type {
  FormOwnerProp,
  FormPetProp,
  FormVetProp,
  PayloadFetchOwner,
} from "../../../types/type";
import { showToast } from "../../../utils/showToast";
import { GetOwners } from "../../../api/GetApi";
import { LoadingForm } from "../../../component/LoadingForm";

import { ToastContainer } from "react-toastify";
import { toLowerStr } from "../../../utils/helpers";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import CaseReferralModal from "../../../component/CaseReferralModal";
import { PostReferralCases } from "../../../api/PostApi";

export default function ReferralsPage() {
  // === Get user login === //
  const userLogin = getUserFromToken()!;
  // === State === //
  const [owners, setOwners] = useState<FormOwnerProp[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedOwner, setExpandedOwner] = useState<string>("");
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [modalData, setModalData] = useState<{
    pet: FormPetProp | null;
    owner: FormOwnerProp | null;
  }>({ pet: null, owner: null });
  // === Loiading === //
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // === useEffect === //
  const useRefFetchDataOwners = useRef(false);
  useEffect(() => {
    if (useRefFetchDataOwners.current) return;
    useRefFetchDataOwners.current = true;
    fetchDataOwners();
  }, []);

  const fetchDataOwners = async () => {
    const veterinarianId = userLogin?.id;
    const hospitalId = userLogin?.hospitalId;

    if (!veterinarianId || !hospitalId) {
      showToast.error("Missing veterinarianId or hospitalId");
      return;
    }

    try {
      const payload: PayloadFetchOwner = {
        veterinarianId,
        hospitalId,
      };

      setMessage("Fetching owners...");
      setLoading(true);

      const resp = await GetOwners(payload);

      if (!resp.success) {
        showToast.error("Error fetching owners");
        return;
      }
      // console.log("resp", resp._data);
      if (resp._data.length === 0) {
        showToast.error("No owners found");
        return;
      }
      setOwners(resp._data || []);

      setMessage("");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching owners:", error);
      setMessage("");
      setLoading(false);
    } finally {
      setMessage("");
      setLoading(false);
    }
  };

  // === Filter Owner === //
  const filteredOwners = useMemo(() => {
    const term = toLowerStr(searchTerm).trim();
    if (!term) return owners;

    return owners.filter((owner) => {
      const firstName = toLowerStr(owner.firstName);
      const lastName = toLowerStr(owner.lastName);
      const email = toLowerStr(owner.email);
      const phone = String(owner.phone ?? "");

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        phone.includes(term) ||
        email.includes(term)
      );
    });
  }, [owners, searchTerm]);

  // ===== Pagination Owner =====
  const [currentOwnerPage, setCurrentOwnerPage] = useState(1);
  const ownerPerPage = 5;
  const totalOwnerPage = Math.ceil(filteredOwners.length / ownerPerPage);
  const startIndexOwner = (currentOwnerPage - 1) * ownerPerPage;
  const currentOwners = filteredOwners.slice(
    startIndexOwner,
    startIndexOwner + ownerPerPage,
  );

  useEffect(() => {
    setCurrentOwnerPage(1);
  }, [searchTerm]);

  // === Functions === //

  const handleOpenReferral = (owner: FormOwnerProp, pet: FormPetProp) => {
    // ✅ เซ็ตข้อมูลก่อนเปิด Modal (ป้องกัน race condition)
    setModalData({ pet, owner });
    setShowReferralModal(true);
  };

  const handleSubmitReferral = async (payload: any) => {
    console.log("Submitting referral:", payload);

    // ✅ เรียก API จริง
    // await api.post("/case-referrals", payload);
    await PostReferralCases({
      metadata: payload.metadata,
      files: payload.files,
    });

    // ✅ แสดง success toast
    // toast.success("ส่งเคสสำเร็จ");
  };

  if (loading) {
    return <LoadingForm text={message} />;
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-800" />
            ส่งข้อมูลสัตว์ป่วยและเจ้าของ
          </h1>
        </div>
      </div>
      {/* ตารางแสดงข้อมูล */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-gray-100"
        >
          {/* Title */}
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              list
            </span>
            รายชื่อเจ้าของ
          </h2>

          {/* Search Bar */}
          <motion.div
            layout
            className="flex items-center w-full sm:w-96 lg:w-xl bg-gray-100 px-4 py-2.5 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all"
          >
            <span className="material-symbols-outlined text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาเจ้าของ (ชื่อ, นามสกุล, เบอร์, อีเมล)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent px-2"
            />
            {searchTerm && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </motion.button>
            )}
          </motion.div>
        </motion.div>
        {filteredOwners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl opacity-50 mb-3">
              group_off
            </span>
            <p>ยังไม่มีข้อมูลเจ้าของ</p>
            <p className="text-sm">เริ่มต้นโดยการเพิ่มข้อมูลเจ้าของด้านบน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentOwners.map((owner: any, index) => (
              <motion.div
                key={owner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                <div className="p-4 md:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Owner Info - Flex Wrap */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold">
                            {owner.firstName?.charAt(0) || "A"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {owner.firstName} {owner.lastName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            ID: {owner.id?.slice(-8)}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info - Wrap อัตโนมัติ */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Phone */}
                        <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-gray-500 text-sm">
                            call
                          </span>
                          <span>{owner.phone || "ไม่มีเบอร์"}</span>
                        </div>

                        {/* Email */}
                        <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-gray-500 text-sm">
                            email
                          </span>

                          {owner.email || "ไม่มีอีเมล"}
                        </div>

                        {/* Address */}

                        {/* Pet Count */}
                        <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-blue-500 text-sm">
                            pets
                          </span>
                          <span>{owner.animals.length} ตัว</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-auto">
                      {/* Expand Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setExpandedOwner(
                            expandedOwner === owner?.id ? "" : owner.id,
                          );
                        }}
                        className="p-2 text-gray-600 items-center flex text-xs gap-x-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title={
                          expandedOwner === owner.id
                            ? "ปิดข้อมูล"
                            : "เปิดข้อมูล"
                        }
                      >
                        {expandedOwner === owner.id
                          ? "ปิดข้อมูล"
                          : "เปิดข้อมูล"}
                        <span className="material-symbols-outlined text-lg">
                          {expandedOwner === owner.id
                            ? "expand_less"
                            : "expand_more"}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedOwner === owner.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 space-y-4 overflow-hidden"
                      >
                        {/* Pets Table or Empty State */}
                        {owner.animals.length ? (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                          >
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                {/* Header with Owner Name and Search */}
                                <tr>
                                  <th colSpan={11} className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-base">
                                          pets
                                        </span>
                                        <span className="font-medium ">
                                          <span className="text-gray-500">
                                            รายการสัตว์ของ
                                          </span>
                                          {" : "}
                                          <span className="text-cyan-600">
                                            {owner.firstName} {owner.lastName}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </th>
                                </tr>

                                {/* Table Headers */}
                                <tr className="border-y border-gray-200 bg-gray-100/50">
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    ลำดับ
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    ชื่อสัตว์
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    สี
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    ชนิด
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    อายุ
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    สายพันธ์
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    เพศ
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    การทำหมัน
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    น้ำหนัก
                                  </th>

                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    ส่งข้อมูล
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-gray-200">
                                {owner.animals.map(
                                  (pet: any, petIndex: number) => (
                                    <motion.tr
                                      key={pet.id}
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        duration: 0.15,
                                        delay: petIndex * 0.02,
                                      }}
                                      className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                      <td className="px-4 py-3 text-gray-600">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                          {String(petIndex + 1).padStart(
                                            2,
                                            "0",
                                          )}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-green-600 text-sm">
                                              pets
                                            </span>
                                          </div>
                                          <span className="font-medium text-gray-900">
                                            {pet.name || "ไม่ระบุ"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <span
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: pet.color
                                                ? `#${pet.color}`
                                                : "#ccc",
                                            }}
                                          />
                                          {pet.color || "-"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${pet.species === "Dog" ? "bg-amber-100 text-amber-700" : ""}
                ${pet.species === "Cat" ? "bg-purple-100 text-purple-700" : ""}
                ${pet.species === "Exotic" ? "bg-emerald-100 text-emerald-700" : ""}
              `}
                                        >
                                          {pet.species === "Dog" && "🐕 สุนัข"}
                                          {pet.species === "Cat" && "🐈 แมว"}
                                          {pet.species === "Exotic" && (
                                            <>🦎 {pet.exoticdescription}</>
                                          )}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-600">
                                        {pet.age ? (
                                          <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">
                                              calendar_today
                                            </span>
                                            {pet.age}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {pet.breed ? (
                                          <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">
                                              emoji_nature
                                            </span>
                                            {pet.breed}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {pet.sex ? (
                                          <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">
                                              transgender
                                            </span>
                                            {pet.sex === "M" ? "ผู้" : "เมีย"}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {pet.sterilization ? (
                                          <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">
                                              sound_detection_dog_barking
                                            </span>
                                            {pet.sterilization === "YES"
                                              ? "ทำหมัน"
                                              : pet.sterilization === "NO"
                                                ? "ไม่ทำหมัน"
                                                : "ไม่ทราบ"}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-gray-600">
                                        {pet.weight ? (
                                          <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">
                                              fitness_center
                                            </span>
                                            {pet.weight} กก.
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>

                                      <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                              handleOpenReferral(owner, pet);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="เพิ่มข้อมูลการส่งตัวสัตว์ป่วย"
                                          >
                                            <Send className="w-5 h-5" />
                                          </motion.button>
                                        </div>
                                      </td>
                                    </motion.tr>
                                  ),
                                )}
                              </tbody>

                              {/* Table Footer */}
                              <tfoot className="bg-gray-50/80">
                                <tr className="border-t border-gray-200">
                                  <td colSpan={11} className="px-4 py-3">
                                    <div className="flex justify-end items-center gap-2 text-sm">
                                      <span className="text-gray-500">
                                        จำนวนสัตว์ป่วยทั้งหมด
                                      </span>
                                      <span className="bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full text-xs">
                                        {owner.animals.length} ตัว
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-center py-12 text-gray-500 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200"
                          ></motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
            <div className="py-3 px-6 flex items-center justify-between">
              {totalOwnerPage > 1 && (
                <>
                  {/* จำนวนหน้า */}
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    หน้าที่{" "}
                    <span className="font-medium text-blue-600">
                      {currentOwnerPage}
                    </span>{" "}
                    จาก <span className="font-medium">{totalOwnerPage}</span>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setCurrentOwnerPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentOwnerPage === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                      aria-label="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1.5 mx-1">
                      {Array.from(
                        { length: Math.min(5, totalOwnerPage) },
                        (_, i) => {
                          let pageNum;
                          if (totalOwnerPage <= 5) {
                            pageNum = i + 1;
                          } else if (currentOwnerPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentOwnerPage >= totalOwnerPage - 2) {
                            pageNum = totalOwnerPage - 4 + i;
                          } else {
                            pageNum = currentOwnerPage - 2 + i;
                          }

                          return (
                            <motion.button
                              key={pageNum}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentOwnerPage(pageNum)}
                              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                                currentOwnerPage === pageNum
                                  ? "bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-sm shadow-blue-500/20"
                                  : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                              }`}
                              aria-label={`ไปหน้า ${pageNum}`}
                              aria-current={
                                currentOwnerPage === pageNum
                                  ? "page"
                                  : undefined
                              }
                            >
                              {pageNum}
                            </motion.button>
                          );
                        },
                      )}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setCurrentOwnerPage((prev) =>
                          Math.min(prev + 1, totalOwnerPage),
                        )
                      }
                      disabled={currentOwnerPage === totalOwnerPage}
                      className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                      aria-label="หน้าถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {showReferralModal && modalData.pet && modalData.owner && (
        <CaseReferralModal
          pet={modalData.pet}
          owner={modalData.owner}
          vet={userLogin as FormVetProp}
          isOpen={showReferralModal}
          onClose={() => {
            setShowReferralModal(false);
            setModalData({ pet: null, owner: null });
          }}
          onSubmit={handleSubmitReferral}
        />
      )}
    </div>
  );
}
