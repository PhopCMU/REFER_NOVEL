import { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GetHospitalData } from "../../api/GetApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseReferral {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  referralType: string;
  status: "PENDING" | "APPOINTED" | "RECEIVED" | "COMPLETED" | "CANCELLED";
  serviceCode: string;
  admin?: { id: string; cmu_codeId: string; name: string };
  resultSummary?: string;
  closedAt?: string;
  veterinarian?: {
    id: string;
    vet_codeId: string;
    firstName: string;
    lastName: string;
    ceLicense: string;
  };
  pet: {
    id: string;
    animal_codeId: string;
    name: string;
    color: string;
    sex: string;
    weight: string;
    age: string;
    sterilization: boolean | string;
    species: string;
    exoticdescription?: string;
    breed: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      owner_codeId: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
}

interface Hospital {
  id: string;
  name: string;
  type: "hospital" | "clinic";
  createdAt: string;
  updatedAt: string;
  caseReferrals: CaseReferral[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    lightColor: string;
    lightBg: string;
  }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "text-amber-600",
    bg: "bg-amber-100",
    lightColor: "text-amber-700",
    lightBg: "bg-amber-50",
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    color: "text-blue-600",
    bg: "bg-blue-100",
    lightColor: "text-blue-700",
    lightBg: "bg-blue-50",
  },
  RECEIVED: {
    label: "รับเคส",
    color: "text-violet-600",
    bg: "bg-violet-100",
    lightColor: "text-violet-700",
    lightBg: "bg-violet-50",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    lightColor: "text-emerald-700",
    lightBg: "bg-emerald-50",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "text-red-600",
    bg: "bg-red-100",
    lightColor: "text-red-700",
    lightBg: "bg-red-50",
  },
};

const SERVICE_LABELS: Record<string, string> = {
  ONC: "มะเร็งวิทยา",
  OPH: "จักษุวิทยา",
  EXOT: "สัตว์พิเศษ",
  FEL: "แมว",
  GI: "ทางเดินอาหาร",
  NEURO: "ระบบประสาท",
  CARD: "หัวใจ",
  DENT: "ทันตกรรม",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-slate-600",
    bg: "bg-slate-100",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace("text-", "bg-")}`}
      />
      {cfg.label}
    </motion.span>
  );
}

function StatCard({
  label,
  value,
  accent,
  sub,
  icon,
}: {
  label: string;
  value: number | string;
  accent: string;
  sub?: string;
  icon: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.02 }}
      className="relative bg-white rounded-2xl p-5 overflow-hidden shadow-md border border-slate-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">{label}</span>
          <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
          {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.8 }}
      />
    </motion.div>
  );
}

function HospitalRow({
  hospital,
  rank,
  maxCount,
  onClick,
  isSelected,
}: {
  hospital: Hospital;
  rank: number;
  maxCount: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  const count = hospital.caseReferrals.length;
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  const completed = hospital.caseReferrals.filter(
    (c) => c.status === "COMPLETED",
  ).length;
  const pending = hospital.caseReferrals.filter(
    (c) => c.status === "PENDING",
  ).length;
  const cancelled = hospital.caseReferrals.filter(
    (c) => c.status === "CANCELLED",
  ).length;

  const rankColors = [
    "bg-amber-500 text-white",
    "bg-slate-400 text-white",
    "bg-amber-700 text-white",
  ];

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={`
        grid grid-cols-[32px_1fr_auto] gap-3 items-center p-4 rounded-xl cursor-pointer 
        transition-all duration-200 border
        ${
          isSelected
            ? "bg-blue-50 border-blue-200 shadow-md"
            : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"
        }
      `}
    >
      {/* Rank */}
      <div
        className={`
        w-8 h-8 rounded-[10px] flex items-center justify-center text-[13px] font-bold shrink-0
        ${rank <= 3 ? rankColors[rank - 1] : "bg-slate-100 text-slate-600"}
      `}
      >
        {rank}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {hospital.name}
          </span>
          <span
            className={`
            text-[10px] px-1.5 py-0.5 rounded-md font-medium border shrink-0
            ${
              hospital.type === "hospital"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }
          `}
          >
            {hospital.type === "hospital" ? "รพ." : "คลินิก"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 rounded-full bg-slate-100 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500"
          />
        </div>

        {/* Mini badges */}
        <div className="flex gap-2 flex-wrap text-[10px]">
          {completed > 0 && (
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ✓ {completed}
            </span>
          )}
          {pending > 0 && (
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ⏳ {pending}
            </span>
          )}
          {cancelled > 0 && (
            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              ✕ {cancelled}
            </span>
          )}
          {count === 0 && (
            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              ไม่มีเคส
            </span>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="text-right shrink-0">
        <div className="text-xl font-bold text-slate-800">{count}</div>
        <div className="text-[10px] text-slate-500 -mt-0.5">เคส</div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"
        />
      )}
    </motion.div>
  );
}

function CaseTable({ referrals }: { referrals: CaseReferral[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const totalPages = Math.ceil(referrals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReferrals = referrals.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Reset page เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [referrals]);
  if (referrals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-xl"
      >
        <div className="text-4xl mb-3">📋</div>
        ไม่มีเคสในปีที่เลือก
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto overflow-hidden"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {[
              "เลขอ้างอิง",
              "หัวข้อ",
              "สัตว์ป่วย",
              "สายพันธุ์",
              "สถานะ",
              "แผนก",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <AnimatePresence mode="wait">
          <motion.tbody
            key={currentPage} // Key ไว้ที่ tbody เพื่อให้ AnimatePresence ตรวจจับการเปลี่ยนหน้า
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {paginatedReferrals.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`
              border-b border-slate-100 hover:bg-slate-50 transition-colors
              ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
            `}
              >
                <td className="px-3 py-3 text-slate-500 font-mono text-xs">
                  {r.referenceNo}
                </td>
                <td className="px-3 py-3 text-slate-700 font-medium">
                  {r.title || "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="text-slate-800 font-medium">{r.pet.name}</div>
                  <div className="text-slate-500 text-xs">
                    {r.pet.owner.firstName} {r.pet.owner.lastName}
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {r.pet.species}
                  {r.pet.exoticdescription
                    ? ` (${r.pet.exoticdescription})`
                    : ""}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    {SERVICE_LABELS[r.serviceCode] ?? r.serviceCode}
                  </span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </AnimatePresence>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200"
        >
          {/* Info */}
          <div className="text-xs text-slate-500">
            แสดง {startIndex + 1} -{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, referrals.length)} จาก{" "}
            {referrals.length} เคส
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
              title="หน้าแรก"
            >
              «
            </motion.button>

            {/* Previous */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
              title="ก่อนหน้า"
            >
              ‹
            </motion.button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // แสดงหน้าแรก, หน้าสุดท้าย, และรอบๆ หน้าปัจจุบัน
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <Fragment key={page}>
                      {showEllipsis && (
                        <span className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
                          ...
                        </span>
                      )}
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(page)}
                        className={`
                          w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center
                          transition-all duration-200
                          ${
                            currentPage === page
                              ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }
                        `}
                      >
                        {page}
                      </motion.button>
                    </Fragment>
                  );
                })}
            </div>

            {/* Next */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  currentPage === totalPages
                    ? "bg-slate-100 text-slate-400"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
              title="ถัดไป"
            >
              ›
            </motion.button>

            {/* Last Page */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  currentPage === totalPages
                    ? "bg-slate-100 text-slate-400"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
              title="หน้าสุดท้าย"
            >
              »
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HospitalData() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const initRef = useRef(false);

  const fetchDataHospitals = async (year: number) => {
    setIsLoading(true);
    setError("");
    try {
      const resp = await GetHospitalData(1000, year);

      if (resp) {
        // --- Fix Start ---
        // ตรวจสอบว่า resp เป็น Array หรือไม่
        if (Array.isArray(resp)) {
          setHospitals(resp);
        }
        // ถ้าไม่ใช่ Array อาจจะถูกห่อด้วย key 'data' หรือ 'hospitals'
        else if (Array.isArray(resp.data)) {
          setHospitals(resp.data);
        } else if (Array.isArray(resp.hospitals)) {
          setHospitals(resp.hospitals);
        } else {
          // กรณีไม่พบข้อมูลในรูปแบบที่คาดไว้ ให้ set เป็น [] และแสดง error
          console.error("API response structure is invalid:", resp);
          setHospitals([]);
          setError("รูปแบบข้อมูลจาก Server ไม่ถูกต้อง");
        }
        // --- Fix End ---

        setSelectedId(null);
      } else {
        setHospitals([]); // กรณี resp เป็น null/undefined
        setError("ไม่พบข้อมูลโรงพยาบาล");
      }
    } catch (e) {
      console.error(e);
      setHospitals([]); // Reset เป็น Array เปล่าเพื่อป้องกัน Crash
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initRef.current) {
      fetchDataHospitals(selectedYear);
      initRef.current = true;
    }
  });

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchDataHospitals(year);
  };

  const sorted = [...hospitals].sort(
    (a, b) => b.caseReferrals.length - a.caseReferrals.length,
  );
  const maxCount = sorted[0]?.caseReferrals.length ?? 1;

  const totalCases = hospitals.reduce((s, h) => s + h.caseReferrals.length, 0);
  const activeCases = hospitals.reduce(
    (s, h) =>
      s +
      h.caseReferrals.filter((c) =>
        ["PENDING", "APPOINTED", "RECEIVED"].includes(c.status),
      ).length,
    0,
  );
  const completedCases = hospitals.reduce(
    (s, h) =>
      s + h.caseReferrals.filter((c) => c.status === "COMPLETED").length,
    0,
  );
  const activeHospitals = hospitals.filter(
    (h) => h.caseReferrals.length > 0,
  ).length;

  const selectedHospital = hospitals.find((h) => h.id === selectedId);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 font-sans text-slate-800"
    >
      {/* Soft Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(14,165,233,0.03),transparent_60%),radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(99,102,241,0.02),transparent_60%)]" />

      <div className="relative z-10 w-full mx-auto p-6 md:p-8">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20"
              >
                🏥
              </motion.div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                ภาพรวมการส่งต่อผู้ป่วย
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-13 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              สถิติการส่งเคสจากโรงพยาบาลและคลินิกทั้งหมดในระบบ
            </p>
          </div>

          {/* Year Selector */}
          <motion.div
            variants={itemVariants}
            className="flex gap-1.5 bg-white border border-slate-200/60 rounded-xl p-1 shadow-sm self-start"
          >
            {YEARS.map((y) => (
              <motion.button
                key={y}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleYearChange(y)}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    selectedYear === y
                      ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                {y + 543}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="เคสทั้งหมด"
            value={totalCases}
            accent="bg-linear-to-br from-blue-600 to-indigo-600"
            sub={`ปี พ.ศ. ${selectedYear + 543}`}
            icon="📋"
          />
          <StatCard
            label="กำลังดำเนินการ"
            value={activeCases}
            accent="bg-linear-to-br from-amber-500 to-orange-500"
            icon="⏳"
          />
          <StatCard
            label="เสร็จสิ้น"
            value={completedCases}
            accent="bg-linear-to-br from-emerald-500 to-green-500"
            icon="✅"
          />
          <StatCard
            label="สถานที่ส่งเคส"
            value={activeHospitals}
            accent="bg-linear-to-br from-violet-500 to-purple-500"
            sub={`จาก ${hospitals.length} แห่ง`}
            icon="🏥"
          />
        </div>

        {/* Main layout */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
          {/* Left: Hospital list */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg p-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto custom-scroll"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                สถานที่ทั้งหมด
              </span>
              <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">
                {hospitals.length} แห่ง
              </span>
            </div>

            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-10 text-slate-400"
                >
                  <div className="text-3xl mb-3 animate-spin">⟳</div>
                  <div className="text-sm">กำลังโหลด...</div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10 text-red-500 text-sm bg-red-50 rounded-xl"
                >
                  {error}
                </motion.div>
              ) : (
                sorted.map((h, i) => (
                  <HospitalRow
                    key={h.id}
                    hospital={h}
                    rank={i + 1}
                    maxCount={maxCount}
                    onClick={() =>
                      setSelectedId(selectedId === h.id ? null : h.id)
                    }
                    isSelected={selectedId === h.id}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Detail panel */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg p-5 min-h-125"
          >
            <AnimatePresence mode="wait">
              {!selectedHospital ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center h-100 text-slate-400 gap-3"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-2"
                  >
                    🏥
                  </motion.div>
                  <div className="text-sm font-medium text-slate-500">
                    เลือกสถานที่เพื่อดูรายละเอียดเคส
                  </div>
                  <div className="text-xs text-slate-400">
                    คลิกที่โรงพยาบาลหรือคลินิกจากรายการด้านซ้าย
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Detail header */}
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md
                        ${
                          selectedHospital.type === "hospital"
                            ? "bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 border border-indigo-300"
                            : "bg-linear-to-br from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-300"
                        }
                      `}
                    >
                      {selectedHospital.type === "hospital" ? "🏥" : "🩺"}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-slate-800 truncate">
                        {selectedHospital.name}
                      </h2>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                          {selectedHospital.type === "hospital"
                            ? "โรงพยาบาลสัตว์"
                            : "คลินิกสัตว์"}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">
                          {selectedHospital.caseReferrals.length} เคส
                        </span>
                      </div>
                    </div>

                    {/* Status breakdown */}
                    <div className="hidden md:flex gap-3 bg-slate-50 px-3 py-2 rounded-xl">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                        const cnt = selectedHospital.caseReferrals.filter(
                          (c) => c.status === k,
                        ).length;
                        if (cnt === 0) return null;
                        return (
                          <motion.div
                            key={k}
                            whileHover={{ scale: 1.05 }}
                            className="text-center min-w-10"
                          >
                            <div className={`text-base font-bold ${v.color}`}>
                              {cnt}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {v.label}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cases table */}
                  <CaseTable referrals={selectedHospital.caseReferrals} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
