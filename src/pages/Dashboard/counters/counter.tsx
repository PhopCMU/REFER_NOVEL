import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GetCaseReferralAdmin } from "../../../api/GetApi";
import { getEndOfDay, getStartOfDay } from "../../../utils/helpers";
import CoverPDF from "../../../component/CoverPDF";
import type {
  CaseItem,
  GetReferralCasesProps,
  PostReferralPayloadEncrypted,
  TReferralType,
  TStatus,
  UpdateCaseStatusProps,
} from "../../../types/type";
import { getUserFromToken } from "../../../utils/authUtils";
import { PostAppointment, PostUpdateCaseStatus } from "../../../api/PostApi";
import { showToast } from "../../../utils/showToast";
import { X } from "lucide-react";

// ─── Config Maps ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  TStatus,
  {
    label: string;
    color: string;
    gradient: string;
    lightGradient: string;
    icon: string;
    tailwindBg: string;
    tailwindText: string;
    step: number;
    borderColor: string;
  }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "#f59e0b",
    gradient: "from-amber-500 to-amber-600",
    lightGradient: "from-amber-50 to-amber-100/50",
    icon: "⏳",
    tailwindBg: "bg-amber-100",
    tailwindText: "text-amber-700",
    step: 0,
    borderColor: "border-amber-200",
  },
  RECEIVED: {
    label: "รับเคสแล้ว",
    color: "#3b82f6",
    gradient: "from-blue-500 to-blue-600",
    lightGradient: "from-blue-50 to-blue-100/50",
    icon: "📥",
    tailwindBg: "bg-blue-100",
    tailwindText: "text-blue-700",
    step: 1,
    borderColor: "border-blue-200",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-violet-600",
    lightGradient: "from-violet-50 to-violet-100/50",
    icon: "✅",
    tailwindBg: "bg-violet-100",
    tailwindText: "text-violet-700",
    step: 2,
    borderColor: "border-violet-200",
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    color: "#06b6d4",
    gradient: "from-cyan-500 to-cyan-600",
    lightGradient: "from-cyan-50 to-cyan-100/50",
    icon: "📅",
    tailwindBg: "bg-cyan-100",
    tailwindText: "text-cyan-700",
    step: 3,
    borderColor: "border-cyan-200",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "#10b981",
    gradient: "from-emerald-500 to-emerald-600",
    lightGradient: "from-emerald-50 to-emerald-100/50",
    icon: "🎉",
    tailwindBg: "bg-emerald-100",
    tailwindText: "text-emerald-700",
    step: 4,
    borderColor: "border-emerald-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "#ef4444",
    gradient: "from-red-500 to-red-600",
    lightGradient: "from-red-50 to-red-100/50",
    icon: "❌",
    tailwindBg: "bg-red-100",
    tailwindText: "text-red-700",
    step: -1,
    borderColor: "border-red-200",
  },
};

const TYPE_CONFIG: Record<
  TReferralType,
  { label: string; color: string; tailwindBg: string; icon: string }
> = {
  CONTINUOUS: {
    label: "ต่อเนื่อง",
    color: "#059669",
    tailwindBg: "bg-emerald-50",
    icon: "🔄",
  },
  SPECIALIST: {
    label: "เฉพาะทาง",
    color: "#7c3aed",
    tailwindBg: "bg-violet-50",
    icon: "🔬",
  },
  ONE_TIME: {
    label: "รายครั้ง",
    color: "#d97706",
    tailwindBg: "bg-amber-50",
    icon: "📌",
  },
};

const SPECIES_EMOJI: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Exotic: "🦎",
};

const SPECIES_COLOR: Record<string, string> = {
  Dog: "from-amber-400 to-amber-500",
  Cat: "from-orange-400 to-orange-500",
  Exotic: "from-emerald-400 to-emerald-500",
};

const STATUS_ORDER: TStatus[] = [
  "PENDING",
  "RECEIVED",
  "CONFIRMED",
  "APPOINTED",
  "COMPLETED",
];

const NEXT_STATUS: Partial<Record<TStatus, TStatus>> = {
  PENDING: "RECEIVED",
  RECEIVED: "CONFIRMED",
  CONFIRMED: "APPOINTED",
  APPOINTED: "COMPLETED",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null | undefined): string => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const fmtTime = (d: string | null | undefined): string => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const fmtDateTime = (d: string | null | undefined): string => {
  const dateStr = fmtDate(d);
  const timeStr = fmtTime(d);
  if (dateStr === "-" || !timeStr) return dateStr;
  return `${dateStr} · ${timeStr}`;
};

const fmtBytes = (b: number) =>
  b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

// ─── Sub Components ────────────────────────────────────────────────────────────
const StatusPill = ({
  status,
  size = "md",
}: {
  status: TStatus;
  size?: "sm" | "md" | "lg";
}) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs font-bold px-2.5 py-1 gap-1.5",
    lg: "text-sm font-bold px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${c.tailwindBg} ${c.tailwindText} border ${c.borderColor} shadow-sm`}
    >
      <span className="text-base">{c.icon}</span>
      {c.label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: TReferralType }) => {
  const c = TYPE_CONFIG[type] || TYPE_CONFIG.ONE_TIME;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.tailwindBg} border`}
      style={{ borderColor: `${c.color}30`, color: c.color }}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
};

// ─── Step Tracker ─────────────────────────────────────────────────────────────
const StepTracker = ({ status }: { status: TStatus }) => {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="relative">
      {/* Progress Bar Background */}
      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full" />

      {/* Progress Bar Fill */}
      <motion.div
        initial={{ width: "0%" }}
        animate={{
          width: `${(currentIdx / (STATUS_ORDER.length - 1)) * 100}%`,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-4 left-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
      />

      <div className="relative flex justify-between">
        {STATUS_ORDER.map((s, i) => {
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const cfg = STATUS_CONFIG[s];

          return (
            <div key={s} className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  boxShadow: isCurrent
                    ? "0 0 0 4px rgba(99, 102, 241, 0.2)"
                    : "none",
                }}
                transition={{ duration: 0.2 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold relative z-10 transition-all ${
                  isCompleted
                    ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  isCurrent ? (
                    cfg.icon
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                ) : (
                  i + 1
                )}
              </motion.div>
              <span
                className={`text-[10px] font-medium mt-1 whitespace-nowrap ${
                  isCompleted ? cfg.tailwindText : "text-gray-400"
                }`}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── CaseCard ────────────────────────────────────────────────────────────────
const CaseCard = ({
  data,
  onClick,
  selected,
}: {
  data: CaseItem;
  onClick: () => void;
  selected: boolean;
}) => {
  // const sc = STATUS_CONFIG[data.status];
  const species = data.pet?.species || "default";
  const speciesGradient =
    SPECIES_COLOR[species] || "from-gray-400 to-gray-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
        selected
          ? "shadow-xl scale-[1.02] ring-2 ring-indigo-400 ring-offset-2"
          : "shadow-md hover:shadow-lg hover:scale-[1.01]"
      }`}
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          selected ? "from-indigo-50 to-white" : "from-white to-gray-50/50"
        }`}
      />

      {/* Species Color Accent */}
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${speciesGradient}`}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${speciesGradient} flex items-center justify-center text-white text-lg shadow-md flex-shrink-0`}
            >
              {SPECIES_EMOJI[species] || "🐾"}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">
                {data.pet?.name || "-"}
              </h3>
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <span>{data.referenceNo || "-"}</span>
              </p>
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <span>{fmtDate(data.createdAt)}</span>
              </p>
            </div>
          </div>
          <StatusPill status={data.status} size="sm" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800 line-clamp-1">
            {data.title || "ไม่มีหัวข้อ"}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200">
              🏷️ {data.serviceCode || "-"}
            </span>
            <TypeBadge type={data.referralType} />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">🏥</span>
              <span className="truncate max-w-[120px]">
                {data.hospital?.name || "-"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">👤</span>
              <span>{data.pet?.owner?.firstName || "-"}</span>
            </div>
          </div>
        </div>

        {/* Selected Indicator */}
        {selected && (
          <motion.div
            layoutId="selectedIndicator"
            className="absolute right-1 top-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ✓
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Upload Appointment PDF Modal ─────────────────────────────────────────────
const UploadAppointmentModal = ({
  caseId,
  firstName,
  lastName,
  onClose,
  onSuccess,
}: {
  caseId: string;
  firstName: string;
  lastName: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file || !appointmentDate || !appointmentTime) {
      showToast.error("กรุณาเลือกวันและเวลาให้ครบถ้วน");
      return;
    }
    setUploading(true);

    try {
      const appointmentDateTimeString = `${appointmentDate} ${appointmentTime}`;

      const payload: PostReferralPayloadEncrypted = {
        caseId: caseId,
        files: [file],
        appointmentDateTime: appointmentDateTimeString,
      };

      const resp = await PostAppointment(payload);

      if (!resp.success) {
        showToast.error("Error uploading file");
        return;
      }

      showToast.success("อัปโหลดสำเร็จ");
      await onSuccess();
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
      showToast.error("เกิดข้อผิดพลาด");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center text-2xl">
                📤
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">อัปโหลดใบนัด</h3>
                <p className="text-sm text-white/80">
                  {firstName} {lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Date Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  วันที่นัดหมาย
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    📅
                  </span>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  เวลานัดหมาย
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    ⏰
                  </span>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                ไฟล์ PDF
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-cyan-400 bg-cyan-50 scale-[1.02]"
                    : file
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.type === "application/pdf") setFile(f);
                  }}
                />

                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                      📄
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-teal-700 text-sm truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmtBytes(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📎</div>
                    <p className="text-sm text-gray-600">
                      คลิกหรือลากไฟล์ PDF มาวาง
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      รองรับไฟล์ .pdf เท่านั้น
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !file || !appointmentDate || !appointmentTime || uploading
                }
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังอัปโหลด...</span>
                  </div>
                ) : (
                  "📤 อัปโหลด"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Confirm Status Modal ──────────────────────────────────────────────────────
const ConfirmStatusModal = ({
  currentStatus,
  nextStatus,
  caseRef,
  defaultNote,
  onClose,
  onConfirm,
}: {
  currentStatus: TStatus;
  nextStatus: TStatus;
  caseRef: string;
  defaultNote?: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) => {
  const [note, setNote] = useState(defaultNote ?? "");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState("");
  const nc = STATUS_CONFIG[nextStatus] || STATUS_CONFIG.PENDING;
  const cc = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PENDING;

  const handleConfirm = async () => {
    if (!note || note.trim() === "") {
      setMessages("กรุณาระบุหมายเหตุ");
      setTimeout(() => setMessages(""), 3000);
      return;
    }
    setLoading(true);
    try {
      let finalNote = note;
      if (nextStatus === "CONFIRMED") {
        finalNote = `สัตวแพทย์ชื่อ ${note}`;
      }
      await onConfirm(finalNote);
      onClose();
    } catch (err) {
      console.error("Status update confirmation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${nc.gradient} p-6 text-center`}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl"
            >
              {nc.icon}
            </motion.div>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-xl text-gray-800 text-center mb-2">
              เปลี่ยนสถานะเคส
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4 font-mono">
              {caseRef}
            </p>

            {/* Status Transition */}
            <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cc.tailwindBg}`} />
                <StatusPill status={currentStatus} size="sm" />
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-gray-400"
              >
                →
              </motion.div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${nc.tailwindBg}`} />
                <StatusPill status={nextStatus} size="sm" />
              </div>
            </div>

            {messages && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"
              >
                <span>⚠️</span>
                {messages}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {nextStatus === "CONFIRMED" ? "ชื่อสัตวแพทย์" : "หมายเหตุ"}
              </label>
              <textarea
                value={note}
                disabled={
                  nextStatus === "RECEIVED" || nextStatus === "APPOINTED"
                }
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  nextStatus === "CONFIRMED"
                    ? "กรุณาระบุชื่อสัตวแพทย์..."
                    : "ระบุหมายเหตุ (ถ้ามี)..."
                }
                className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-700 placeholder-gray-400"
                rows={3}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all bg-gradient-to-r ${nc.gradient} hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                "ยืนยันการเปลี่ยนสถานะ"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────
const DetailPanel = ({
  data,
  onClose,
  onStatusUpdate,
  onRefresh,
  userLogin,
}: {
  data: CaseItem | null;
  onClose: () => void;
  onStatusUpdate: (
    id: string,
    newStatus: TStatus,
    note: string,
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
  userLogin: any;
}) => {
  const [tab, setTab] = useState("overview");
  const [showUpload, setShowUpload] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    setTab("overview");
  }, [data?.id]);

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center text-gray-400 gap-6 bg-gradient-to-br from-gray-50 to-white"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-8xl mb-4"
        >
          🐾
        </motion.div>
        <div className="text-center max-w-sm">
          <h3 className="font-bold text-2xl text-gray-600 mb-2">
            เลือกเคสเพื่อดูรายละเอียด
          </h3>
          <p className="text-gray-400">
            คลิกที่รายการทางซ้ายมือเพื่อดูข้อมูลและจัดการเคส
          </p>
        </div>
        <div className="mt-8 flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ delay: i * 0.2, repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-indigo-200 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  const nextStatus = NEXT_STATUS[data.status];
  const canAdvance =
    !!nextStatus && data.status !== "COMPLETED" && data.status !== "CANCELLED";
  const canCancel = data.status !== "COMPLETED" && data.status !== "CANCELLED";

  const tabs = [
    { id: "overview", label: "ภาพรวม", icon: "📋" },
    { id: "timeline", label: "ประวัติ", icon: "📜" },
    {
      id: "appointments",
      label: "นัดหมาย",
      icon: "📅",
      count: data.appointments?.length || 0,
    },
    {
      id: "files",
      label: "เอกสาร",
      icon: "📂",
      count:
        data.medicalFiles?.filter((f: any) => f.category !== "APPOINTMENT")
          .length || 0,
    },
  ];

  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Top Bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                SPECIES_COLOR[data.pet?.species || "default"] || "from-gray-200 to-gray-200"
              } flex items-center justify-center text-white text-2xl shadow-lg`}
            >
              {SPECIES_EMOJI[data.pet?.species || "default"] || "🐾"}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-bold text-2xl text-gray-900">
                  {data.pet?.name || "-"}
                </h1>
                <StatusPill status={data.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                  {data.pet?.species === "Exotic"
                    ? data.pet?.exoticdescription || data.pet?.breed
                    : data.pet?.breed || "-"}
                </span>
                <span>•</span>
                <span>{data.pet?.sex === "M" ? "เพศผู้" : data.pet?.sex === "F" ? "เพศเมีย" : "-"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-xs font-mono text-gray-600">
                {data.referenceNo || "-"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pb-6">
          <StepTracker status={data.status} />
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-4 flex gap-3">
          {data.status === "APPOINTED" ? (
            <button
              onClick={() => setShowUpload(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:from-cyan-600 hover:to-teal-600 transition-all"
            >
              <span className="text-lg">📤</span>
              อัปโหลดใบนัด
            </button>
          ) : (
            <div className="flex-1 relative group">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed"
              >
                <span className="text-lg">📤</span>
                อัปโหลดใบนัด
              </button>
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ต้องได้รับใบนัดก่อนจึงอัปโหลดได้
              </div>
            </div>
          )}

          {canAdvance && nextStatus && STATUS_CONFIG[nextStatus] && (
            <button
              onClick={() => setShowConfirm(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all bg-gradient-to-r ${STATUS_CONFIG[nextStatus].gradient} hover:shadow-xl`}
            >
              <span className="text-lg">{STATUS_CONFIG[nextStatus].icon}</span>
              เปลี่ยนเป็น "{STATUS_CONFIG[nextStatus].label}"
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6">
          {tabs.map((t: any) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                tab === t.id
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    tab === t.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Case Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  รายละเอียดเคส #{data.referenceNo || "-"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="หัวข้อ" value={data.title} />
                  <InfoItem
                    label="ประเภท"
                    value={TYPE_CONFIG[data.referralType]?.label}
                  />
                  <InfoItem
                    label="บริการ"
                    value={`${data.serviceCode || "-"} · ${data.serviceReferral?.name || "-"}`}
                  />
                  <InfoItem
                    label="วันที่ส่งตัว"
                    value={fmtDateTime(data.createdAt)}
                  />
                  <InfoItem
                    label="อัปเดตล่าสุด"
                    value={fmtDateTime(data.updatedAt)}
                  />
                  {data.closedAt && (
                    <InfoItem
                      label="วันที่ปิดเคส"
                      value={fmtDateTime(data.closedAt)}
                    />
                  )}
                </div>
                {data.description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {data.description}
                    </p>
                  </div>
                )}
                {data.resultSummary && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="font-bold text-emerald-700 block mb-1">
                      🎯 สรุปผล
                    </span>
                    <p className="text-sm text-emerald-600">
                      {data.resultSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Hospital Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🏥</span>
                  โรงพยาบาลต้นทาง
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      🏥
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {data.hospital?.name || "-"}
                      </p>
                      <p className="text-sm text-gray-500">สถานพยาบาล</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {data.veterinarian?.firstName || "-"} {data.veterinarian?.lastName || ""}
                      </p>
                      <p className="text-sm text-gray-500">สัตวแพทย์</p>
                    </div>
                  </div>
                  {data.veterinarian?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        📞
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {data.veterinarian?.phone}
                        </p>
                        <p className="text-sm text-gray-500">เบอร์ติดต่อ</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="flex flex-col gap-4bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  ข้อมูลเจ้าของ #{((data.pet?.owner as any)?.owner_codeId) || "-"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="ชื่อ"
                    value={`${data.pet?.owner?.firstName || "-"} ${data.pet?.owner?.lastName || ""}`}
                  />
                  <InfoItem
                    label="เบอร์ติดต่อ"
                    value={data.pet?.owner?.phone}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <InfoItem label="อีเมล" value={data.pet?.owner?.email} />
                  <InfoItem
                    label="ที่อยู่"
                    value={(data.pet?.owner as any)?.address || "-"}
                  />
                </div>
              </div>

              {/* Pet Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🐾</span>
                  ข้อมูลสัตว์เลี้ยง #{((data?.pet as any)?.animal_codeId) || "-"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="ชื่อ" value={data.pet?.name} />
                  <InfoItem
                    label="ชนิด / พันธุ์"
                    value={
                      data.pet?.species === "Exotic"
                        ? `${data.pet?.exoticdescription || "Exotic"} (${data.pet?.breed || "-"})`
                        : `${data.pet?.species || "-"} / ${data.pet?.breed || "-"}`
                    }
                  />
                  <InfoItem
                    label="เพศ / อายุ"
                    value={`${data.pet?.sex === "M" ? "ชาย" : data.pet?.sex === "F" ? "หญิง" : "-"} / ${data.pet?.age || "-"}`}
                  />
                  <InfoItem label="สี" value={data.pet?.color || "-"} />
                  <InfoItem label="น้ำหนัก" value={data.pet?.weight ? `${data.pet.weight} กก.` : "-"} />
                  <InfoItem
                    label="ประสัติทำหมัน"
                    value={`${data.pet?.sterilization === "YES" ? "ทำแล้ว" : data.pet?.sterilization === "NO" ? "ยังไม่ได้ทำ" : "ไม่ทราบ"} `}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {tab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {data.caseStatusLogs && data.caseStatusLogs.length > 0 ? (
                [...data.caseStatusLogs]
                  .reverse()
                  .map((log: any, i: number) => {
                    const nc = STATUS_CONFIG[log.newStatus as TStatus];
                    return (
                      <motion.div
                        key={log.id || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-8 pb-6 last:pb-0"
                      >
                        {/* Timeline Line */}
                        {i < data.caseStatusLogs.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
                        )}

                        {/* Timeline Dot */}
                        <div
                          className={`absolute left-0 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center`}
                          style={{ borderColor: nc?.color || "#e2e8f0" }}
                        >
                          <span className="text-xs">{nc?.icon || "•"}</span>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 ml-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">
                              {fmtDateTime(log.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <StatusPill status={log.newStatus} size="sm" />
                          </div>
                          {log.note && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
              ) : (
                <EmptyState icon="📭" title="ไม่มีประวัติสถานะ" />
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
              {data.appointments && data.appointments.length > 0 ? (
                data.appointments.map((apt: any, i: number) => {
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
              ) : (
                <EmptyState
                  icon="📅"
                  title="ยังไม่มีนัดหมาย"
                  description="สามารถอัปโหลดใบนัดได้ที่ปุ่ม 'อัปโหลดใบนัด'"
                />
              )}
            </motion.div>
          )}

          {tab === "files" && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {data.medicalFiles && data.medicalFiles.length > 0 && (
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
                  .filter((f: any) => f.category !== "APPOINTMENT")
                  .map((f: any, i: number) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                            f.category === "HISTORY"
                              ? "from-blue-400 to-blue-600"
                              : f.category === "LAB"
                                ? "from-purple-400 to-purple-600"
                                : f.category === "XRAY"
                                  ? "from-cyan-400 to-cyan-600"
                                  : f.category === "PHOTO"
                                    ? "from-green-400 to-green-600"
                                    : "from-gray-400 to-gray-600"
                          } flex items-center justify-center text-white text-xl`}
                        >
                          {f.category === "HISTORY"
                            ? "📄"
                            : f.category === "LAB"
                              ? "🧪"
                              : f.category === "XRAY"
                                ? "🩻"
                                : f.category === "PHOTO"
                                  ? "📷"
                                  : f.category === "BIOPSY"
                                    ? "🔬"
                                    : "📁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                            {f.originalName || f.name || "-"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                              {f.category || "-"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {fmtBytes(f.sizeBytes || 0)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            window.open(
                              `${import.meta.env.VITE_API_BASE_URL_FILE}${f.fileUrl}`,
                              "_blank",
                            )
                          }
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200 opacity-0 group-hover:opacity-100"
                        >
                          ⬇️ ดาวน์โหลด
                        </button>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <EmptyState
                  icon="📂"
                  title="ไม่มีเอกสาร"
                  description="กดปุ่ม 'อัปโหลดใบนัด' เพื่อเพิ่มไฟล์"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadAppointmentModal
          caseId={data.id}
          firstName={data.pet?.owner?.firstName ?? " "}
          lastName={data.pet?.owner?.lastName ?? " "}
          onClose={() => setShowUpload(false)}
          onSuccess={onRefresh}
        />
      )}

      {showConfirm && nextStatus && (
        <ConfirmStatusModal
          currentStatus={data.status}
          nextStatus={nextStatus}
          caseRef={data.referenceNo || ""}
          defaultNote={
            nextStatus === "RECEIVED"
              ? `เจ้าหน้าที่ ${userLogin?.firstName || ""} ${userLogin?.lastName || ""}`
              : nextStatus === "APPOINTED"
                ? `เจ้าหน้าที่ ${userLogin?.firstName || ""} ${userLogin?.lastName || ""} ออกใบนัด ${new Date().toLocaleDateString(
                    "th-TH",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}`
                : undefined
          }
          onClose={() => setShowConfirm(false)}
          onConfirm={async (note) => {
            await onStatusUpdate(data.id, nextStatus, note);
          }}
        />
      )}

      {showCancelConfirm && (
        <ConfirmStatusModal
          currentStatus={data.status}
          nextStatus={"CANCELLED"}
          caseRef={data.referenceNo || ""}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={async (note) => {
            await onStatusUpdate(data.id, "CANCELLED", note);
          }}
        />
      )}
    </motion.div>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────
const InfoItem = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
  </div>
);

const EmptyState = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <span className="text-6xl mb-4">{icon}</span>
    <p className="font-medium text-gray-500">{title}</p>
    {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CounterPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<TStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const initRef = useRef(false);
  const userLogin = getUserFromToken();

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
    let s = startDate
      ? getStartOfDay(new Date(startDate))
      : getStartOfDay(new Date());
    let e = endDate ? getEndOfDay(new Date(endDate)) : getEndOfDay(new Date());
    
    if (startDate && !endDate) e = getEndOfDay(new Date(startDate));
    else if (!startDate && endDate) s = getStartOfDay(new Date(endDate));
    
    await fetchDataCases(s, e);
  };

  const handleStatusUpdate = async (
    id: string,
    newStatus: TStatus,
    note: string,
  ) => {
    const autoNote = (() => {
      if (newStatus === "RECEIVED") {
        return (
          note.trim() ||
          `เจ้าหน้าที่ ${userLogin?.firstName || ""} ${userLogin?.lastName || ""}`
        );
      }
      return note;
    })();

    const payload: UpdateCaseStatusProps = {
      caseId: id,
      status: newStatus,
      note: autoNote,
    };

    const resp = await PostUpdateCaseStatus(payload);

    if (!resp.success) {
      showToast.error(resp ? resp : "เกิดข้อผิดพลาดในการแก้ไขสถานะ");
      return;
    }

    setCases((prev: any) =>
      prev.map((c: any) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              caseStatusLogs: [
                ...(c.caseStatusLogs || []),
                {
                  id: Date.now().toString(),
                  oldStatus: c.status,
                  newStatus,
                  note: autoNote,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c,
      ),
    );
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cases.filter((c) => {
      const matchSearch =
        !q ||
        (c.referenceNo?.toLowerCase().includes(q) ?? false) ||
        (c.title?.toLowerCase().includes(q) ?? false) ||
        (c.pet?.name?.toLowerCase().includes(q) ?? false);
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

  const selectedCase = selected
    ? (cases.find((c) => c.id === selected) ?? null)
    : null;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-96 flex flex-col bg-gradient-to-b from-indigo-900 to-indigo-950 text-white shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl">
              🐾
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide">
                Counter Dashboard
              </h1>
              <p className="text-sm text-indigo-300">
                ระบบจัดการการส่งตัวสัตว์ป่วย
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-indigo-300">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสัตว์, เลขอ้างอิง..."
              className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TStatus | "ALL")}
            className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="ALL" className="bg-indigo-900 text-white">
              ทุกสถานะ
            </option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s} className="bg-indigo-900 text-white">
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-indigo-300 block mb-1 ml-1">
                เริ่มวันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-indigo-300 block mb-1 ml-1">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 [color-scheme:dark]"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-400 to-indigo-500 text-white text-sm font-bold rounded-xl hover:from-indigo-500 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังโหลด...
              </>
            ) : (
              <>
                <span>🔍</span>
                ค้นหาตามช่วงเวลา
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {STATUS_ORDER.map((st) => {
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() =>
                  setFilterStatus(filterStatus === st ? "ALL" : st)
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                  filterStatus === st
                    ? `${cfg.tailwindBg} ${cfg.tailwindText} shadow-lg scale-105`
                    : "bg-white/10 text-indigo-200 hover:bg-white/20"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{stats[st] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-4xl mb-2">📭</span>
                  <span className="text-sm">ไม่พบข้อมูล</span>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
                    <span>พบ {filtered.length} รายการ</span>
                    <span>เรียงตามวันที่ล่าสุด</span>
                  </div>
                  {filtered.map((c) => (
                    <CaseCard
                      key={c.id}
                      data={c}
                      onClick={() => setSelected(c.id)}
                      selected={selected === c.id}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <DetailPanel
          data={selectedCase}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={handleSearch}
          userLogin={userLogin}
        />
      </div>
    </div>
  );
}
