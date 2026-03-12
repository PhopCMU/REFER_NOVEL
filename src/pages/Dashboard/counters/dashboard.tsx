import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  transformCaseData,
  type ApiCaseData,
  type DashboardCase,
  type GetReferralCasesProps,
} from "../../../types/type";
import { GetCaseReferralAdmin } from "../../../api/GetApi";
import { getEndOfDay, getStartOfDay } from "../../../utils/helpers";
import { exportToXLSX } from "../../../utils/exportUtils";
import { FileBox } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
  twColor: string;
  twBg: string;
}

// ── Status Configuration ─────────────────────────────────────────────────
const STATUS_META: Record<string, StatusMeta> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "#F59E0B",
    bg: "#FEF3C7",
    dot: "#F59E0B",
    twColor: "text-amber-600",
    twBg: "bg-amber-100",
  },
  RECEIVED: {
    label: "รับเรื่องแล้ว",
    color: "#3B82F6",
    bg: "#DBEAFE",
    dot: "#3B82F6",
    twColor: "text-blue-600",
    twBg: "bg-blue-100",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    dot: "#8B5CF6",
    twColor: "text-violet-600",
    twBg: "bg-violet-100",
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    color: "#06B6D4",
    bg: "#CFFAFE",
    dot: "#06B6D4",
    twColor: "text-cyan-600",
    twBg: "bg-cyan-100",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "#10B981",
    bg: "#D1FAE5",
    dot: "#10B981",
    twColor: "text-emerald-600",
    twBg: "bg-emerald-100",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "#EF4444",
    bg: "#FEE2E2",
    dot: "#EF4444",
    twColor: "text-red-600",
    twBg: "bg-red-100",
  },
};

const SPECIES_EMOJI: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Exotic: "🦜",
  default: "🐾",
};

const STAT_CARDS = [
  {
    key: "all",
    label: "เคสทั้งหมด",
    icon: "📋",
    accent: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    key: "PENDING",
    label: "รอดำเนินการ",
    icon: "⏳",
    accent: "amber",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "APPOINTED",
    label: "นัดหมายแล้ว",
    icon: "📅",
    accent: "cyan",
    gradient: "from-cyan-500 to-cyan-600",
  },
  {
    key: "COMPLETED",
    label: "เสร็จสิ้น",
    icon: "✅",
    accent: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
  },
];

// ── Helper Functions ─────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

// ── Components ───────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
}
function StatusBadge({ status }: StatusBadgeProps) {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.twBg} ${m.twColor}`}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: m.dot }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      />
      {m.label}
    </motion.span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function DashboardAdmin() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [filterSpecies, setSpecies] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const initRef = useRef(false);

  const [cases, setCases] = useState<ApiCaseData[]>([]);

  const RAW_CASES: DashboardCase[] = useMemo(() => {
    return cases.map(transformCaseData);
  }, [cases]);

  const fetchDataCases = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const payload: GetReferralCasesProps = { timeStart: start, timeEnd: end };
      const result = await GetCaseReferralAdmin(payload);
      if (result && Array.isArray(result.data)) {
        setCases(result.data);
      } else if (Array.isArray(result)) {
        setCases(result);
      } else {
        setCases([]);
      }
    } catch {
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchDataCases(getStartOfDay(new Date()), getEndOfDay(new Date()));
  }, []);

  const handleSearch = async () => {
    setCurrentPage(1);
    let s = startDate
      ? getStartOfDay(new Date(startDate))
      : getStartOfDay(new Date());
    let e = endDate ? getEndOfDay(new Date(endDate)) : getEndOfDay(new Date());
    
    if (startDate && !endDate) e = getEndOfDay(new Date(startDate));
    else if (!startDate && endDate) s = getStartOfDay(new Date(endDate));
    
    await fetchDataCases(s, e);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: RAW_CASES.length };
    Object.keys(STATUS_META).forEach((s) => {
      c[s] = RAW_CASES.filter((x) => x.status === s).length;
    });
    return c;
  }, [RAW_CASES]);

  const filtered = useMemo(() => {
    if (!Array.isArray(RAW_CASES)) return [];
    let list = [...RAW_CASES];

    if (filterStatus !== "all") {
      list = list.filter((c) => c.status === filterStatus);
    }
    if (filterSpecies !== "all") {
      list = list.filter((c) => c.petSpecies === filterSpecies);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.title?.toLowerCase().includes(q) ?? false) ||
          (c.referenceNo?.toLowerCase().includes(q) ?? false) ||
          (c.petName?.toLowerCase().includes(q) ?? false) ||
          (c.ownerName?.toLowerCase().includes(q) ?? false) ||
          (c.serviceName?.toLowerCase().includes(q) ?? false),
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
    } else if (sortBy === "oldest") {
      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      });
    } else if (sortBy === "status") {
      list.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    }

    return list;
  }, [RAW_CASES, filterStatus, filterSpecies, search, sortBy]);

  const selectedCase = selected
    ? RAW_CASES.find((c) => c.id === selected) || null
    : null;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterSpecies, search, sortBy]);

  const handleExportExcel = async () => {
    await exportToXLSX(filtered, "cases-report");
  };

  // const handleExportPDF = () => {
  //   exportToPDF(filtered, "cases-report");
  // };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-800 font-sans">
      <div className="px-8 py-7 mx-auto max-w-[1600px]">
        {/* Title Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
            Dashboard ภาพรวมเคสทั้งหมด
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            ติดตามสถานะการส่งต่อผู้ป่วยสัตว์จากโรงพยาบาลเครือข่าย
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-4 mb-8"
        >
          {STAT_CARDS.map((s) => (
            <motion.div
              key={s.key}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(s.key)}
              className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all ${
                filterStatus === s.key
                  ? `bg-gradient-to-br ${s.gradient} shadow-lg shadow-${s.accent}-500/30`
                  : "bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:border-slate-300/80 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{s.icon}</span>
                <div
                  className={`text-3xl font-bold ${
                    filterStatus === s.key
                      ? "text-white"
                      : `text-${s.accent}-600`
                  }`}
                >
                  {counts[s.key] ?? 0}
                </div>
                <div
                  className={`text-xs font-medium mt-1 ${
                    filterStatus === s.key ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </div>
              </div>
              {filterStatus === s.key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-white/10 backdrop-blur-sm"
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 flex-wrap mb-5"
        >
          {Object.entries(STATUS_META).map(([k, m]) => (
            <motion.button
              key={k}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(filterStatus === k ? "all" : k)}
              className={`px-4 py-1.5 rounded-full border-none cursor-pointer text-xs font-semibold transition-all shadow-sm ${
                filterStatus === k ? "text-white shadow-md" : "hover:shadow"
              }`}
              style={{
                backgroundColor: filterStatus === k ? m.color : m.bg,
                color: filterStatus === k ? "#fff" : m.color,
              }}
            >
              {m.label} ({counts[k] ?? 0})
            </motion.button>
          ))}
          {filterStatus !== "all" && (
            <motion.button
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setFilter("all")}
              className="px-4 py-1.5 rounded-full border border-slate-300 cursor-pointer text-xs bg-white/80 text-slate-500 hover:bg-slate-100 transition shadow-sm"
            >
              ✕ ล้างตัวกรอง
            </motion.button>
          )}
        </motion.div>

        {/* Date Range Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-blue-800 rounded-2xl p-5 mb-5 shadow-xl"
        >
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-blue-200 block mb-2 ml-1 font-medium">
                เริ่มวันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 [color-scheme:dark] placeholder-white/50"
              />
            </div>
            <div>
              <label className="text-xs text-blue-200 block mb-2 ml-1 font-medium">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 [color-scheme:dark] placeholder-white/50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg h-[42px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                  กำลังโหลด...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  ค้นหา
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportExcel}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg h-[42px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                  กำลังโหลด...
                </>
              ) : (
                <>
                  <FileBox className="w-4 h-4" />
                  Export Excel
                </>
              )}
            </motion.button>
            {/* <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg h-[42px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                  กำลังโหลด...
                </>
              ) : (
                <>
                  <FileBox className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </motion.button> */}
          </div>
        </motion.div>

        {/* Search + Filter Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 mb-4 flex gap-3 items-center flex-wrap shadow-lg border border-white/50"
        >
          <div className="flex-1 min-w-[260px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเคส, ชื่อสัตว์, เจ้าของ, บริการ..."
              className="w-full py-2.5 pl-10 pr-3 border border-slate-200 rounded-xl text-sm outline-none bg-white text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <select
            value={filterSpecies}
            onChange={(e) => setSpecies(e.target.value)}
            className="py-2.5 px-4 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 cursor-pointer hover:border-slate-300 transition focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">🐾 สัตว์ทุกประเภท</option>
            <option value="Dog">🐕 สุนัข</option>
            <option value="Cat">🐈 แมว</option>
            <option value="Exotic">🦜 สัตว์พิเศษ</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 px-4 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 cursor-pointer hover:border-slate-300 transition focus:ring-2 focus:ring-blue-100"
          >
            <option value="newest">📅 เรียงล่าสุด</option>
            <option value="oldest">📅 เรียงเก่าสุด</option>
            <option value="status">📊 เรียงตามสถานะ</option>
          </select>

          <span className="ml-auto text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-full">
            {filtered.length} / {RAW_CASES.length} เคส
          </span>
        </motion.div>

        {/* Main Layout */}
        <div className="flex gap-4 items-start">
          {/* Table */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/50"
          >
            <div className="grid grid-cols-[1fr_140px_160px_110px_80px] px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>เคส / สัตว์ป่วย</div>
              <div>บริการ</div>
              <div>โรงพยาบาล</div>
              <div>สถานะ</div>
              <div className="text-center">ไฟล์</div>
            </div>

            {paginatedData.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="py-16 px-5 text-center text-slate-400"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-5xl mb-3"
                >
                  🔍
                </motion.div>
                <div className="text-lg font-medium text-slate-500">
                  ไม่พบเคสที่ตรงกับเงื่อนไข
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {paginatedData.map((c, i) => (
                  <motion.div
                    key={c.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(selected === c.id ? null : c.id)}
                    className={`grid grid-cols-[1fr_140px_160px_110px_80px] px-5 py-3.5 border-b border-slate-100 cursor-pointer transition-all hover:bg-blue-50/50 ${
                      selected === c.id ? "bg-blue-50/80 shadow-inner" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          c.petSpecies === "Dog"
                            ? "bg-blue-100"
                            : c.petSpecies === "Cat"
                              ? "bg-pink-100"
                              : "bg-purple-100"
                        }`}
                      >
                        {SPECIES_EMOJI[c.petSpecies] || SPECIES_EMOJI.default}
                      </motion.div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">
                          {c.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {c.petName} ({c.petBreed}) • {c.ownerName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          #{c.referenceNo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-0.5">
                          {c.serviceCode}
                        </span>
                        <div className="text-xs text-slate-600 leading-relaxed line-clamp-1">
                          {c.serviceName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-xs text-slate-600 leading-relaxed flex items-center gap-1">
                        <span>🏥</span>
                        <span className="line-clamp-1">
                          {c.hospitalName.length > 20
                            ? c.hospitalName.slice(0, 18) + "…"
                            : c.hospitalName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex items-center justify-center gap-1 flex-col">
                      <span className="text-sm font-semibold text-slate-700">
                        📎 {c.medicalFiles}
                      </span>
                      {c.appointments > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[11px] text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full"
                        >
                          📅 {c.appointments}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                variants={itemVariants}
                className="mt-2 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl px-5 py-3.5 border-t border-slate-100"
              >
                <span className="text-sm text-slate-500">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <div className="flex gap-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    ←
                  </motion.button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30"
                            : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    →
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-[340px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex-shrink-0 border border-white/50"
              >
                <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-blue-700 px-5 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white/60 text-[11px] mb-1 font-mono">
                        #{selectedCase.referenceNo}
                      </div>
                      <div className="text-white font-bold text-base">
                        {selectedCase.title}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelected(null)}
                      className="bg-white/20 border-none rounded-xl w-8 h-8 cursor-pointer text-white text-sm flex items-center justify-center hover:bg-white/30 transition backdrop-blur-sm"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <StatusBadge status={selectedCase.status} />
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {formatDate(selectedCase.createdAt)}
                    </span>
                  </div>

                  {/* Pet Info */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-xl p-4 ${
                      selectedCase.petSpecies === "Dog"
                        ? "bg-blue-50"
                        : selectedCase.petSpecies === "Cat"
                          ? "bg-pink-50"
                          : "bg-purple-50"
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                      ข้อมูลสัตว์ป่วย
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        {SPECIES_EMOJI[selectedCase.petSpecies] ||
                          SPECIES_EMOJI.default}
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {selectedCase.petName}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {selectedCase.petSpecies} • {selectedCase.petBreed}
                        </div>
                        <div className="text-xs text-slate-500">
                          อายุ {selectedCase.petAge} •{" "}
                          {selectedCase.petSex === "F" ? "เพศเมีย" : "เพศผู้"}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Owner */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      เจ้าของสัตว์
                    </div>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      {selectedCase.ownerName}
                    </div>
                    {selectedCase.ownerPhone && (
                      <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <span>📞</span>
                        {selectedCase.ownerPhone}
                      </div>
                    )}
                  </div>

                  {/* Service */}
                  <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4">
                    <div className="text-[11px] font-semibold text-violet-700 mb-2 uppercase tracking-wide">
                      บริการที่ส่งต่อ
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                        {selectedCase.serviceCode}
                      </span>
                      <span className="text-sm text-violet-900 font-medium">
                        {selectedCase.serviceName}
                      </span>
                    </div>
                  </div>

                  {/* Hospital + Vet */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400 mb-1">
                        โรงพยาบาล
                      </div>
                      <div className="text-xs font-semibold text-slate-800 leading-relaxed">
                        🏥 {selectedCase.hospitalName}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400 mb-1">
                        สัตวแพทย์
                      </div>
                      <div className="text-xs font-semibold text-slate-800">
                        👨‍⚕️ {selectedCase.vetName}
                      </div>
                      {selectedCase.vetPhone && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          📞 {selectedCase.vetPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files & Appointments */}
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl mb-1">📎</div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {selectedCase.medicalFiles}
                      </div>
                      <div className="text-[11px] text-emerald-500">
                        ไฟล์เอกสาร
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl mb-1">📅</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {selectedCase.appointments}
                      </div>
                      <div className="text-[11px] text-sky-500">นัดหมาย</div>
                    </motion.div>
                  </div>

                  {/* Status Flow */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                      ความคืบหน้า
                    </div>
                    <div className="flex items-center gap-0">
                      {[
                        "PENDING",
                        "RECEIVED",
                        "CONFIRMED",
                        "APPOINTED",
                        "COMPLETED",
                      ].map((s, i, arr) => {
                        const m = STATUS_META[s];
                        const statuses = [
                          "PENDING",
                          "RECEIVED",
                          "CONFIRMED",
                          "APPOINTED",
                          "COMPLETED",
                        ];
                        const currentIdx = statuses.indexOf(
                          selectedCase.status,
                        );
                        const stepIdx = statuses.indexOf(s);
                        const done =
                          stepIdx <= currentIdx &&
                          selectedCase.status !== "CANCELLED";
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                  done
                                    ? "text-white shadow-md"
                                    : "text-slate-400 bg-slate-200"
                                }`}
                                style={{
                                  backgroundColor: done ? m.color : undefined,
                                }}
                              >
                                {done ? "✓" : stepIdx + 1}
                              </motion.div>
                              <div
                                className={`text-[9px] mt-1 text-center leading-tight ${
                                  done ? m.twColor : "text-slate-300"
                                }`}
                              >
                                {m.label.split(" ").slice(0, 2).join(" ")}
                              </div>
                            </div>
                            {i < arr.length - 1 && (
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                className="h-0.5 flex-1 mx-0.5 origin-left"
                                style={{
                                  backgroundColor:
                                    done && stepIdx < currentIdx
                                      ? m.color
                                      : "#E2E8F0",
                                  marginTop: -12,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 flex gap-6 flex-wrap shadow-lg border border-white/50"
        >
          {Object.entries(STATUS_META).map(([k, m]) => (
            <motion.div
              key={k}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: m.color }}
              />
              <span className="text-xs text-slate-600">{m.label}</span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-100"
                style={{ color: m.color }}
              >
                {counts[k] ?? 0}
              </span>
            </motion.div>
          ))}
          <div className="ml-auto text-xs text-slate-400 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
            อัปเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
