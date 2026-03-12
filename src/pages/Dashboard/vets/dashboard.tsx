import { useEffect, useMemo, useRef, useState } from "react";
import type { GetReferralCasesProps } from "../../../types/type";
import { getEndOfDay, getStartOfDay } from "../../../utils/helpers";
import { GetCaseReferral } from "../../../api/GetApi";

// ─── Types / Interfaces ──────────────────────────────────────────────────────

export interface Owner {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Pet {
  name: string;
  species: "Dog" | "Cat" | "Exotic" | string;
  breed: string;
  sex: "M" | "F" | string;
  age: string;
  color: string;
  weight: string;
  owner: Owner;
}

export interface Veterinarian {
  firstName: string;
  lastName: string;
}

export interface Hospital {
  name: string;
}

export interface ServiceReferral {
  name: string;
}

export interface MedicalFile {
  category: "HISTORY" | "PHOTO" | "LAB" | string;
}

export interface Appointment {
  date: string; // ISO string
  note: string;
}

export interface CaseStatusLog {
  oldStatus: CaseStatus;
  newStatus: CaseStatus;
  note: string;
  createdAt: string; // ISO string
}

export type ReferralType = "CONTINUOUS" | "SPECIALIST" | "ONE_TIME";
export type CaseStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "APPOINTED"
  | "COMPLETED"
  | "CANCELLED";

export interface CaseReferral {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  serviceCode: string;
  status: CaseStatus;
  referralType: ReferralType;
  hospital: Hospital;
  veterinarian: Veterinarian;
  pet: Pet;
  serviceReferral: ServiceReferral;
  medicalFiles: MedicalFile[];
  appointments: Appointment[];
  caseStatusLogs: CaseStatusLog[];
  closedAt: string | null;
  createdAt: string; // ISO string
}

// Config Types
export interface StatusConfig {
  label: string;
  icon: string;
  dot: string;
  badge: string;
  bar: string;
}

export interface TypeConfig {
  label: string;
  badge: string;
}

export interface FileChipMap {
  [key: string]: {
    label: string;
    cls: string;
  };
}

// Props Interfaces
export interface StatCardProps {
  status: CaseStatus;
  count: number;
  total: number;
}

export interface FileChipProps {
  category: string;
}

export interface StatusTimelineProps {
  logs: CaseStatusLog[];
}

export interface CaseDetailPanelProps {
  c: CaseReferral | null;
  onClose: () => void;
}

export interface CaseCardProps {
  c: CaseReferral;
  isSelected: boolean;
  onClick: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CaseStatus, StatusConfig> = {
  PENDING: {
    label: "รอดำเนินการ",
    icon: "⏳",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    bar: "bg-amber-400",
  },
  RECEIVED: {
    label: "รับเคสแล้ว",
    icon: "📥",
    dot: "bg-blue-400",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    bar: "bg-blue-400",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    icon: "✅",
    dot: "bg-violet-400",
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    bar: "bg-violet-400",
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    icon: "📅",
    dot: "bg-cyan-400",
    badge: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bar: "bg-cyan-400",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: "🎉",
    dot: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bar: "bg-emerald-400",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: "❌",
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-700 border border-red-200",
    bar: "bg-red-400",
  },
};

const TYPE_CONFIG: Record<ReferralType, TypeConfig> = {
  CONTINUOUS: {
    label: "ต่อเนื่อง",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  SPECIALIST: {
    label: "เฉพาะทาง",
    badge: "bg-violet-50 text-violet-600 border border-violet-200",
  },
  ONE_TIME: {
    label: "รายครั้ง",
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
  },
};

const SPECIES_EMOJI: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Exotic: "🦎",
};

const STATUS_ORDER: CaseStatus[] = [
  "PENDING",
  "RECEIVED",
  "CONFIRMED",
  "APPOINTED",
  "COMPLETED",
];

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ status, count, total }: StatCardProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xl">{cfg.icon}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
        >
          {pct}%
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-800 leading-none">
        {count}
      </div>
      <div className="text-xs text-slate-500 font-medium">{cfg.label}</div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FileChip({ category }: FileChipProps) {
  const map: FileChipMap = {
    HISTORY: { label: "ประวัติ", cls: "bg-slate-100 text-slate-600" },
    PHOTO: { label: "รูปภาพ", cls: "bg-sky-50 text-sky-600" },
    LAB: { label: "แลบ", cls: "bg-purple-50 text-purple-600" },
    XRAY: { label: "X-ray", cls: "bg-orange-50 text-orange-600" },
    BIOPSY: { label: "ชิ้นเนื้อ", cls: "bg-rose-50 text-rose-600" },
    APPOINTMENT: { label: "ใบนัด", cls: "bg-emerald-50 text-emerald-600" },
  };
  const m = map[category] || {
    label: category,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function StatusTimeline({ logs }: StatusTimelineProps) {
  const sorted = [...(logs || [])].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((log, i) => (
        <div
          key={`${log.oldStatus}-${log.newStatus}-${i}`}
          className="flex gap-3 items-start"
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full mt-0.5 ${STATUS_CONFIG[log.newStatus]?.dot || "bg-slate-300"}`}
            />
            {i < sorted.length - 1 && (
              <div
                className="w-px flex-1 bg-slate-200 mt-1"
                style={{ minHeight: 16 }}
              />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="text-xs font-semibold text-slate-700">
              {STATUS_CONFIG[log.newStatus]?.label || log.newStatus}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{log.note}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {fmtDate(log.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CaseDetailPanel({ c, onClose }: CaseDetailPanelProps) {
  if (!c) return null;
  const sCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.PENDING;
  const tCfg = TYPE_CONFIG[c.referralType] || TYPE_CONFIG.ONE_TIME;
  const stepIdx = STATUS_ORDER.indexOf(c.status);

  return (
    <div className="flex flex-col h-screen overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div>
          <div className="text-xs text-slate-400 font-mono mb-1">
            {c.referenceNo || "-"}
          </div>
          <div className="font-bold text-slate-800 text-lg leading-tight">
            {c.title || "ไม่มีชื่อเคส"}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {c.description || "-"}
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5"
          aria-label="ปิดรายละเอียด"
        >
          ✕
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sCfg.badge}`}
          >
            {sCfg.icon} {sCfg.label}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tCfg.badge}`}
          >
            {tCfg.label}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {c.serviceCode || "-"}
          </span>
        </div>

        {/* Progress Steps */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            ความคืบหน้า
          </div>
          <div className="flex items-center gap-1">
            {STATUS_ORDER.map((s, i) => {
              const done = i <= stepIdx;
              const cur = i === stepIdx;
              const cfg = STATUS_CONFIG[s];
              return (
                <div
                  key={s}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${done ? cfg.bar + " text-white shadow-sm" : "bg-slate-100 text-slate-400"} ${cur ? "ring-2 ring-offset-1 ring-cyan-300" : ""}`}
                  >
                    {done && i < stepIdx ? "✓" : i + 1}
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-0.5 ${i < stepIdx ? "bg-cyan-300" : "bg-slate-100"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {STATUS_ORDER.map((s) => (
              <div
                key={s}
                className="text-[9px] text-slate-400 text-center"
                style={{ width: 24 }}
              >
                {STATUS_CONFIG[s].label.slice(0, 4)}
              </div>
            ))}
          </div>
        </div>

        {/* Pet Info */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            ข้อมูลสัตว์เลี้ยง
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              {SPECIES_EMOJI[c.pet?.species] || "🐾"}
            </div>
            <div>
              <div className="font-bold text-slate-800">
                {c.pet?.name || "-"}
              </div>
              <div className="text-xs text-slate-500">
                {c.pet?.species || "-"} · {c.pet?.breed || "-"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              [
                "เพศ",
                c.pet?.sex === "M"
                  ? "ตัวผู้ ♂"
                  : c.pet?.sex === "F"
                    ? "ตัวเมีย ♀"
                    : "-",
              ],
              ["อายุ", c.pet?.age || "-"],
              ["น้ำหนัก", c.pet?.weight ? `${c.pet.weight} กก.` : "-"],
              ["สี", c.pet?.color || "-"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="bg-white rounded-lg p-2 border border-slate-100"
              >
                <div className="text-[10px] text-slate-400">{k}</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            เจ้าของ
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-base font-bold text-indigo-500">
              {c.pet?.owner?.firstName?.[0] || "อ"}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {c.pet?.owner?.firstName || "-"} {c.pet?.owner?.lastName || ""}
              </div>
              <div className="text-xs text-slate-500">
                📞 {c.pet?.owner?.phone || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Clinic & Vet */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              โรงพยาบาล
            </div>
            <div className="text-xs font-semibold text-slate-700">
              🏥 {c.hospital?.name || "-"}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              สัตวแพทย์
            </div>
            <div className="text-xs font-semibold text-slate-700">
              👨‍⚕️ {c.veterinarian?.firstName || "-"}{" "}
              {c.veterinarian?.lastName || ""}
            </div>
          </div>
        </div>

        {/* Clinic */}
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
            คลินิกที่ส่งต่อ
          </div>
          <div className="text-sm font-semibold text-indigo-700">
            🏨 {c.serviceReferral?.name || "-"}
          </div>
        </div>

        {/* Appointment */}
        {c.appointments && c.appointments.length > 0 && (
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
            <div className="text-xs font-bold text-cyan-600 mb-2">
              📅 การนัดหมาย
            </div>
            {c.appointments.map((a, i) => (
              <div
                key={`${a.date}-${i}`}
                className={i > 0 ? "mt-2 pt-2 border-t border-cyan-100" : ""}
              >
                <div className="text-xs font-semibold text-cyan-800">
                  {fmtDate(a.date)}
                </div>
                <div className="text-[11px] text-cyan-600 mt-1">{a.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        {c.medicalFiles && c.medicalFiles.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              เอกสารแนบ
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.medicalFiles.map((f, i) => (
                <FileChip key={`${f.category}-${i}`} category={f.category} />
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            ประวัติสถานะ
          </div>
          <StatusTimeline logs={c.caseStatusLogs || []} />
        </div>

        {/* Meta */}
        <div className="text-[10px] text-slate-400 text-center pb-2">
          สร้างเมื่อ {fmtDate(c.createdAt)}
        </div>
      </div>
    </div>
  );
}

function CaseCard({ c, isSelected, onClick }: CaseCardProps) {
  const sCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.PENDING;
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "border-indigo-300 bg-indigo-50 shadow-md ring-2 ring-indigo-200" : "border-slate-100 bg-white hover:border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {c.referenceNo || "-"}
          </div>
          <div className="font-semibold text-slate-800 text-sm mt-0.5 truncate">
            {c.title || "ไม่มีชื่อเคส"}
          </div>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${sCfg.dot}`}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">
          {SPECIES_EMOJI[c.pet?.species] || "🐾"}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-700 truncate">
            {c.pet?.name || "-"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {c.pet?.breed || "-"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sCfg.badge}`}
        >
          {sCfg.icon} {sCfg.label}
        </span>
        <div className="flex gap-1">
          {[...new Set(c.medicalFiles?.map((f) => f.category) || [])]
            .slice(0, 3)
            .map((cat) => (
              <FileChip key={cat} category={cat} />
            ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
        <span className="truncate flex-1 mr-2">
          🏥 {c.hospital?.name || "-"}
        </span>
        <span className="flex-shrink-0">
          {fmtDate(c.createdAt).split(" ")[0]}
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardVet() {
  const [cases, setCases] = useState<CaseReferral[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const useReferralCase = useRef(false);

  // --- Data Fetching Logic ---
  const fetchDataCases = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const payload: GetReferralCasesProps = {
        timeStart: start,
        timeEnd: end,
      };

      // GetCaseReferral คืนค่า resp.data มาแล้ว (ซึ่งก็คือ { data: [...] })
      const result = await GetCaseReferral(payload);

      if (result && Array.isArray(result.data)) {
        setCases(result.data);
      } else if (Array.isArray(result)) {
        // Fallback: ถ้า API เปลี่ยนโครงสร้างมาเป็น Array ตรงๆ
        setCases(result);
      } else {
        setCases([]);
      }
    } catch (error) {
      console.error("Failed to fetch cases", error);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Initial Load (Run once) ---
  useEffect(() => {
    if (useReferralCase.current) return;
    useReferralCase.current = true;

    // Default to Today
    const todayStart = getStartOfDay(new Date());
    const todayEnd = getEndOfDay(new Date());

    fetchDataCases(todayStart, todayEnd);
  }, []);

  const handleSearch = async () => {
    // ใช้ helper functions เพื่อความสม่ำเสมอ
    let timeStart = startDate
      ? getStartOfDay(new Date(startDate))
      : getStartOfDay(new Date());
    let timeEnd = endDate
      ? getEndOfDay(new Date(endDate))
      : getEndOfDay(new Date());

    if (startDate && !endDate) {
      timeEnd = getEndOfDay(new Date(startDate));
    } else if (!startDate && endDate) {
      timeStart = getStartOfDay(new Date(endDate));
    }

    fetchDataCases(timeStart, timeEnd);
  };

  const stats = useMemo(() => {
    const s: Record<CaseStatus, number> = {
      PENDING: 0,
      RECEIVED: 0,
      CONFIRMED: 0,
      APPOINTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    if (Array.isArray(cases)) {
      cases.forEach((c) => {
        if (c.status && s[c.status] !== undefined) {
          s[c.status]++;
        }
      });
    }
    return s;
  }, [cases]);

  const filtered = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (c.referenceNo?.toLowerCase().includes(q) ?? false) ||
        (c.title?.toLowerCase().includes(q) ?? false) ||
        (c.pet?.name?.toLowerCase().includes(q) ?? false);
      const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus, cases]);

  const selectedCase = selected ? cases.find((c) => c.id === selected) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full mx-auto px-4 md:px-6 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {STATUS_ORDER.map((s) => (
            <StatCard
              key={s}
              status={s}
              count={stats[s] || 0}
              total={cases.length}
            />
          ))}
        </div>

        {/* Summary Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-2 font-medium">
              สัดส่วนเคสตามสถานะ (ไม่รวมยกเลิก)
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {STATUS_ORDER.map((s) => {
                const totalActive = cases.length - (stats["CANCELLED"] || 0);
                const pct =
                  totalActive > 0 ? (stats[s] / totalActive) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={s}
                    className={`${STATUS_CONFIG[s].bar} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${STATUS_CONFIG[s].label}: ${stats[s]}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex gap-3 mt-2 flex-wrap">
              {STATUS_ORDER.map(
                (s) =>
                  stats[s] > 0 && (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`}
                      />
                      <span className="text-[10px] text-slate-500">
                        {STATUS_CONFIG[s].label} ({stats[s]})
                      </span>
                    </div>
                  ),
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {cases.length}
              </div>
              <div className="text-[10px] text-slate-400">เคสทั้งหมด</div>
            </div>
            <div className="w-px bg-slate-100" />
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {stats["COMPLETED"] || 0}
              </div>
              <div className="text-[10px] text-slate-400">เสร็จสิ้น</div>
            </div>
            <div className="w-px bg-slate-100" />
            <div>
              <div className="text-2xl font-bold text-amber-500">
                {stats["PENDING"] || 0}
              </div>
              <div className="text-[10px] text-slate-400">รอดำเนินการ</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400"
                placeholder="ค้นหา เลขอ้างอิง, ชื่อเคส, ชื่อสัตว์..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
              />
            </div>
            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-slate-600"
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-slate-600"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-xl hover:bg-indigo-600 transition-colors font-medium shadow-sm"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-sky-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>กำลังโหลด...</span>
                  </>
                ) : (
                  "ค้นหา"
                )}
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterStatus === "ALL" ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              ทั้งหมด ({cases.length})
            </button>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? STATUS_CONFIG[s].badge + " shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label} (
                {stats[s] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`grid gap-4 ${selectedCase ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}
        >
          {/* Case List */}
          <div className={selectedCase ? "lg:col-span-3" : ""}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-600">
                พบ {filtered.length} เคส
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-slate-500 font-medium">
                  ไม่พบเคสที่ค้นหา
                </div>
                <div className="text-slate-400 text-sm mt-1">
                  ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((c) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    isSelected={selected === c.id}
                    onClick={() => setSelected(selected === c.id ? null : c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedCase && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-md sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden">
                <CaseDetailPanel
                  c={selectedCase}
                  onClose={() => setSelected(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
