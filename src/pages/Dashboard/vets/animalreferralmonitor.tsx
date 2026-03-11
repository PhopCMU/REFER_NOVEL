import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GetCaseReferral } from "../../../api/GetApi";

import { getEndOfDay, getStartOfDay } from "../../../utils/helpers";
import CoverPDF from "../../../component/CoverPDF";
import type {
  CaseItem,
  GetReferralCasesProps,
  TReferralType,
  TStatus,
} from "../../../types/type";

// ─── Config Maps ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  TStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: string;
    tailwindBg: string;
    tailwindText: string;
  }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "⏳",
    tailwindBg: "bg-amber-100",
    tailwindText: "text-amber-700",
  },
  RECEIVED: {
    label: "รับเคสแล้ว",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "📥",
    tailwindBg: "bg-blue-100",
    tailwindText: "text-blue-700",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: "✅",
    tailwindBg: "bg-violet-100",
    tailwindText: "text-violet-700",
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    color: "#06b6d4",
    bg: "#cffafe",
    icon: "📅",
    tailwindBg: "bg-cyan-100",
    tailwindText: "text-cyan-700",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "#10b981",
    bg: "#d1fae5",
    icon: "🎉",
    tailwindBg: "bg-emerald-100",
    tailwindText: "text-emerald-700",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "❌",
    tailwindBg: "bg-red-100",
    tailwindText: "text-red-700",
  },
};

const TYPE_CONFIG: Record<
  TReferralType,
  { label: string; color: string; tailwindBg: string }
> = {
  CONTINUOUS: {
    label: "ต่อเนื่อง",
    color: "#059669",
    tailwindBg: "bg-emerald-50",
  },
  SPECIALIST: {
    label: "เฉพาะทาง",
    color: "#7c3aed",
    tailwindBg: "bg-violet-50",
  },
  ONE_TIME: { label: "รายครั้ง", color: "#d97706", tailwindBg: "bg-amber-50" },
};

const SPECIES_EMOJI: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Exotic: "🦎",
};
const STATUS_ORDER: TStatus[] = [
  "PENDING",
  "RECEIVED",
  "CONFIRMED",
  "APPOINTED",
  "COMPLETED",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const fmtBytes = (b: number) =>
  b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

// ─── Components ──────────────────────────────────────────────────────────────

const Badge = ({
  label,
  color,
  bg,
  small,
  className = "",
}: {
  label: string;
  color?: string;
  bg?: string;
  small?: boolean;
  className?: string;
}) => (
  <span
    className={`
      inline-flex items-center gap-1 rounded-full font-semibold border
      ${small ? "text-[11px] py-0.5 px-2" : "text-xs py-1 px-2.5"}
      ${className}
    `}
    style={{
      backgroundColor: bg || "#f3f4f6",
      color: color || "#374151",
      borderColor: color ? `${color}30` : "#e5e7eb",
    }}
  >
    {label}
  </span>
);

const StatusBadge = ({ status }: { status: TStatus }) => {
  const c = STATUS_CONFIG[status];
  if (!c) return null;
  return (
    <Badge
      label={`${c.icon} ${c.label}`}
      color={c.color}
      bg={c.bg}
      className={`${c.tailwindBg} ${c.tailwindText} border-none`}
    />
  );
};

const ProgressStepper = ({ status }: { status: TStatus }) => {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-0 my-3">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const cfg = STATUS_CONFIG[s];

        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-none">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: done ? cfg.color : "#e5e7eb",
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${done ? "text-white" : "text-gray-400"} ${isCurrent ? `ring-4 ring-offset-1` : ""}`}
                // style={{
                //   ringColor: isCurrent ? `${cfg.color}40` : "transparent",
                // }}
              >
                {done ? (isCurrent ? cfg.icon : "✓") : i + 1}
              </motion.div>
              <span
                className={`text-[9px] mt-1 font-semibold whitespace-nowrap transition-colors ${done ? "" : "text-gray-400"}`}
                style={{ color: done ? cfg.color : "#9ca3af" }}
              >
                {cfg.label}
              </span>
            </div>

            {i < STATUS_ORDER.length - 1 && (
              <div
                className="flex-1 h-1 mx-1 mb-4 rounded-full"
                style={{
                  backgroundColor:
                    i < currentIdx ? (STATUS_ORDER[i] as any).color : "#e5e7eb",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const FileIcon = ({ category }: { category: string }) => {
  const icons: Record<string, string> = {
    HISTORY: "📄",
    LAB: "🧪",
    XRAY: "🩻",
    PHOTO: "📷",
    BIOPSY: "🔬",
  };
  return <span>{icons[category] || "📎"}</span>;
};

const CaseCard = ({
  data,
  onClick,
  selected,
}: {
  data: CaseItem;
  onClick: () => void;
  selected: boolean;
}) => {
  const sc = STATUS_CONFIG[data.status];
  //   const speciesDisplay =
  //     data.pet.species === "Exotic"
  //       ? data.pet.exoticdescription || data.pet.breed
  //       : data.pet.breed;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className={`
        p-3 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden
        ${selected ? "bg-sky-50 border-2 border-sky-400 shadow-lg shadow-sky-100" : "bg-white border-2 border-slate-100 hover:border-slate-200 shadow-sm"}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{SPECIES_EMOJI[data.pet.species]}</span>
            <span className="font-bold text-sm text-slate-800 truncate">
              {data.pet.name}
            </span>
            <Badge
              label={TYPE_CONFIG[data.referralType]?.label}
              color={TYPE_CONFIG[data.referralType]?.color}
              small
            />
          </div>
          <div className="text-xs text-slate-500 mb-1 truncate">
            {data.title}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              {data.serviceCode}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {data.referenceNo}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {sc && <StatusBadge status={data.status} />}
          <span className="text-[10px] text-slate-400">
            {fmtDate(data.createdAt)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-500 flex gap-3 border-t border-dashed border-slate-100 pt-2">
        <span>🏥 {data.hospital.name}</span>
      </div>
    </motion.div>
  );
};

const DetailPanel = ({
  data,
  onClose,
}: {
  data: CaseItem | any;
  onClose: () => void;
}) => {
  const [tab, setTab] = useState("overview");

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 bg-gradient-to-b from-slate-50 to-white">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl"
        >
          🐾
        </motion.span>
        <div className="font-bold text-lg text-slate-500">
          เลือกเคสเพื่อดูรายละเอียด
        </div>
      </div>
    );

  // ตรวจสอบว่ามี owner ไหม (จาก DB จริงอาจจะไม่มี)
  // หมายเหตุ: ถ้าต้องการชื่อเจ้าของ อาจต้อง Query เพิ่มเติมหรือ Backend ต้องส่งมาให้
  // const hasOwner = data.owner && data.owner.firstName;

  const tabs = [
    { id: "overview", label: "ภาพรวม" },
    { id: "timeline", label: "ประวัติสถานะ" },
    {
      id: "appointments",
      label: `นัดหมาย (${data.appointments?.length || 0})`,
    },
    { id: "files", label: `เอกสาร (${data.medicalFiles?.length || 0})` },
  ];

  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-white"
    >
      <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ rotate: -45 }}
              animate={{ rotate: 0 }}
              className="text-4xl"
            >
              {SPECIES_EMOJI[data.pet.species] || "🐾"}
            </motion.span>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900">
                {data.pet.name}
              </h2>
              <div className="text-xs text-slate-500">
                {data.pet.species === "Exotic"
                  ? `${data.pet.exoticdescription || data.pet.breed}`
                  : data.pet.breed}
                · {data.pet.sex === "M" ? "♂ ชาย" : "♀ หญิง"} · {data.pet.age}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 rounded-lg p-1.5 transition-colors text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          <StatusBadge status={data.status} />
          <Badge
            label={
              TYPE_CONFIG[data.referralType as keyof typeof TYPE_CONFIG]
                ?.label || data.referralType
            }
            color={
              TYPE_CONFIG[data.referralType as keyof typeof TYPE_CONFIG]?.color
            }
          />
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {data.serviceCode} · {data.serviceReferral?.name}
          </span>
        </div>

        <ProgressStepper status={data.status} />

        <div className="flex gap-1 border-b border-slate-100 -mb-5 pb-0 mt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${tab === t.id ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <InfoSection title="📋 รายละเอียดเคส">
                <InfoRow label="หัวข้อ" value={data.title} />
                <InfoRow label="รายละเอียด" value={data.description || "-"} />
                <InfoRow
                  label="ประเภท"
                  value={
                    TYPE_CONFIG[data.referralType as keyof typeof TYPE_CONFIG]
                      ?.label || data.referralType
                  }
                />
                <InfoRow
                  label="บริการ"
                  value={`${data.serviceCode} · ${data.serviceReferral?.name} `}
                />
                <InfoRow label="วันที่ส่งตัว" value={fmtDate(data.createdAt)} />
                <InfoRow label="อัปเดตล่าสุด" value={fmtDate(data.updatedAt)} />
                {data.closedAt && (
                  <InfoRow
                    label="วันที่ปิดเคส"
                    value={fmtDate(data.closedAt)}
                  />
                )}

                {data.resultSummary && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                    <span className="font-bold">🎯 สรุปผล:</span>{" "}
                    {data.resultSummary}
                  </div>
                )}
              </InfoSection>

              <InfoSection title="🏥 โรงพยาบาลต้นทาง">
                <InfoRow
                  label="ชื่อสถานพยาบาล"
                  value={data.hospital?.name || "-"}
                />
                <InfoRow
                  label="สัตวแพทย์"
                  value={`${data.veterinarian?.firstName || ""} ${data.veterinarian?.lastName || ""}`}
                />
                <InfoRow
                  label="ติดต่อ"
                  value={data.veterinarian?.phone || "-"}
                />
              </InfoSection>

              <InfoSection title="🐾 ข้อมูลสัตว์เลี้ยง">
                <InfoRow label="ชื่อ" value={data.pet.name} />
                <InfoRow
                  label="ชนิด / พันธุ์"
                  value={
                    data.pet.species === "Exotic"
                      ? `${data.pet.exoticdescription || "Exotic"} (${data.pet.breed})`
                      : `${data.pet.species} / ${data.pet.breed}`
                  }
                />
                <InfoRow
                  label="เพศ / อายุ"
                  value={`${data.pet.sex === "M" ? "ชาย" : "หญิง"} / ${data.pet.age}`}
                />
                <InfoRow label="สี" value={data.pet.color} />
                <InfoRow label="น้ำหนัก" value={`${data.pet.weight} กก.`} />
              </InfoSection>

              {/* ซ่อนส่วนเจ้าของไว้ชั่วคราวเพราะ DB จริงไม่มีข้อมูลนี้มา */}
              {/* <InfoSection title="👤 เจ้าของ"> ... </InfoSection> */}
            </motion.div>
          )}

          {tab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative pl-6"
            >
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {data.caseStatusLogs && data.caseStatusLogs.length > 0 ? (
                [...data.caseStatusLogs].reverse().map((log, i) => {
                  const nc = STATUS_CONFIG[log.newStatus as TStatus];
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex gap-4 mb-6"
                    >
                      <div
                        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${nc?.tailwindBg || "bg-gray-100"} border-2`}
                        style={{ borderColor: nc?.color }}
                      >
                        {nc?.icon || "?"}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* <span className="text-xs text-slate-400">
                            {STATUS_CONFIG[log.oldStatus as TStatus]?.label ||
                              log.oldStatus}
                          </span>
                          <span className="text-slate-300">→</span> */}
                          <Badge
                            label={nc?.label || log.newStatus}
                            color={nc?.color}
                            bg={nc?.bg}
                            small
                          />
                        </div>
                        {log.note && (
                          <p className="text-sm text-slate-600">{log.note}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {fmtDate(log.createdAt)} {fmtTime(log.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <EmptyState icon="📭" text="ไม่มีประวัติสถานะ" />
              )}
            </motion.div>
          )}

          {tab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {data.appointments && data.appointments.length > 0
                ? data.appointments.map((apt: any, i: number) => {
                    const appointmentFile = data.medicalFiles?.find(
                      (f: any) =>
                        f.category === "APPOINTMENT" &&
                        f.appointmentId === apt.id,
                    );

                    return (
                      <motion.div
                        key={apt.id || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold">
                              #{i + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">
                                ใบนัดหมาย
                              </h4>
                              <p className="text-xs text-gray-500">
                                {appointmentFile ? "อัปโหลดแล้ว" : "รออัปโหลด"}
                              </p>
                            </div>
                          </div>

                          {appointmentFile && (
                            <button
                              onClick={() =>
                                window.open(
                                  `${import.meta.env.VITE_API_BASE_URL_FILE}${appointmentFile.fileUrl}`,
                                  "_blank",
                                )
                              }
                              className="flex items-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-600 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors border border-cyan-200"
                            >
                              <span>⬇️</span>
                              ดาวน์โหลด
                            </button>
                          )}
                        </div>

                        <div className="flex gap-3 mb-3">
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              วันที่นัดหมาย
                            </p>
                            <p className="font-medium text-gray-800">
                              {apt.date ? fmtDate(apt.date) : "-"}
                            </p>
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              เวลานัดหมาย
                            </p>
                            <p className="font-medium text-gray-800">
                              {apt.date ? fmtTime(apt.date) : "-"}
                            </p>
                          </div>
                        </div>

                        {apt.note && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-600 mb-1">
                              📝 หมายเหตุ
                            </p>
                            <p className="text-sm text-amber-800">{apt.note}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                : null}
            </motion.div>
          )}

          {tab === "files" && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* 🔥 ปุ่มรวมไฟล์ */}
              {data.medicalFiles?.length > 0 && (
                <div className="flex justify-end mb-2">
                  <CoverPDF
                    medicalFiles={data.medicalFiles}
                    baseUrl={import.meta.env.VITE_API_BASE_URL_FILE}
                    outputFileName="medical-record.pdf"
                  />
                </div>
              )}

              {data.medicalFiles && data.medicalFiles.length > 0 ? (
                data.medicalFiles
                  .filter((f: any) => f.category !== "APPOINTMENT") // ✅ กรองไฟล์นัดหมายออก
                  .map((f: any) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
                    >
                      <span className="text-2xl">
                        <FileIcon category={f.category} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-700 truncate">
                          {f.originalName || f.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {fmtBytes(f.sizeBytes)}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          window.open(
                            `${import.meta.env.VITE_API_BASE_URL_FILE}${f.fileUrl}`,
                            "_blank",
                          );
                        }}
                        className="text-xs bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg font-medium hover:bg-sky-100 transition-colors"
                      >
                        ดาวน์โหลด
                      </button>
                    </div>
                  ))
              ) : (
                <EmptyState icon="📂" text="ไม่มีเอกสาร" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const InfoSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 font-bold text-sm text-slate-600">
      {title}
    </div>
    <div className="p-4 space-y-2">{children}</div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-slate-400 w-28 shrink-0">{label}</span>
    <span className="text-slate-700 font-medium">{value}</span>
  </div>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="text-center py-10 text-slate-400">
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-sm">{text}</div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AnimalReferralCase() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<TStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // New state for date range
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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

      // --- FIX: ตรวจสอบ result.data เพราะ structure คือ { data: [...] } ---
      if (result && Array.isArray(result.data)) {
        setCases(result.data);
      } else {
        // Fallback: ถ้า API เปลี่ยนโครงสร้างมาเป็น Array ตรงๆ
        if (Array.isArray(result)) {
          setCases(result);
        } else {
          setCases([]);
        }
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

  // --- Search Handler (Triggered by Button) ---
  const handleSearch = async () => {
    let timeStart = startDate
      ? `${startDate}T00:00:00.000Z`
      : getStartOfDay(new Date());
    let timeEnd = endDate
      ? `${endDate}T23:59:59.999Z`
      : getEndOfDay(new Date());

    if (startDate && !endDate) {
      timeEnd = `${startDate}T23:59:59.999Z`;
    } else if (!startDate && endDate) {
      timeStart = `${endDate}T00:00:00.000Z`;
    }

    fetchDataCases(timeStart, timeEnd);
  };

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.referenceNo.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.pet.name.toLowerCase().includes(q);
      const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus, cases]);

  const stats = useMemo(() => {
    const s: Record<TStatus, number> = {} as any;
    STATUS_ORDER.forEach((st) => {
      s[st] = cases.filter((c) => c.status === st).length;
    });
    return s;
  }, [cases]);

  const selectedCase = selected ? cases.find((c) => c.id === selected) : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {/* Left Sidebar */}
      <div className="w-[400px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-lg">
              🐾
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">VetReferral</h1>
              <p className="text-xs text-sky-100">ระบบตรวจสอบการส่งตัว</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-2.5 text-sky-200">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา ชื่อสัตว์, โรงพยาบาล..."
              className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sky-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>

          {/* Filters: Status & Date */}
          <div className="flex flex-col gap-2">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as TStatus | "ALL")
              }
              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
            >
              <option value="ALL" className="text-slate-800">
                ทุกสถานะ
              </option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="text-slate-800">
                  {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>

            {/* Date Range Inputs */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-sky-100 mb-1 block">
                  เริ่มวันที่
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-sky-100 mb-1 block">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="mt-1 bg-white text-sky-600 font-bold py-2 rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                "🔍 ค้นหาตามช่วงเวลา"
              )}
            </button>
          </div>
        </div>

        {/* Stats Chips */}
        <div className="p-3 flex gap-1 border-b border-slate-100 flex-wrap">
          {STATUS_ORDER.map((st) => {
            const cfg = STATUS_CONFIG[st];
            return (
              <div
                key={st}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.tailwindBg} ${cfg.tailwindText}`}
                style={{ borderColor: `${cfg.color}30` }}
              >
                <span>{cfg.icon}</span>
                <span>{stats[st]}</span>
              </div>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-bold">
              ผลลัพธ์: {filtered.length} รายการ
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mb-4"></div>
              <span>กำลังโหลดข้อมูลจาก Server...</span>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.length === 0 ? (
                <EmptyState icon="📭" text="ไม่พบข้อมูล" />
              ) : (
                filtered.map((c) => (
                  <CaseCard
                    key={c.id}
                    data={c}
                    onClick={() => setSelected(c.id)}
                    selected={selected === c.id}
                  />
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <DetailPanel data={selectedCase} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
