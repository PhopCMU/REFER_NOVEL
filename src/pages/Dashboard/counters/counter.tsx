import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GetCaseReferralAdmin } from "../../../api/GetApi";
import { getEndOfDay, getStartOfDay } from "../../../utils/helpers";
import CoverPDF from "../../../component/CoverPDF";
import type {
  CaseItem,
  GetReferralCasesProps,
  TReferralType,
  TStatus,
  UpdateCaseStatusProps,
} from "../../../types/type";
import { getUserFromToken } from "../../../utils/authUtils";
import { PostUpdateCaseStatus } from "../../../api/PostApi";
import { showToast } from "../../../utils/showToast";

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
    step: number;
  }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "⏳",
    tailwindBg: "bg-amber-100",
    tailwindText: "text-amber-700",
    step: 0,
  },
  RECEIVED: {
    label: "รับเคสแล้ว",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "📥",
    tailwindBg: "bg-blue-100",
    tailwindText: "text-blue-700",
    step: 1,
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: "✅",
    tailwindBg: "bg-violet-100",
    tailwindText: "text-violet-700",
    step: 2,
  },
  APPOINTED: {
    label: "นัดหมายแล้ว",
    color: "#06b6d4",
    bg: "#cffafe",
    icon: "📅",
    tailwindBg: "bg-cyan-100",
    tailwindText: "text-cyan-700",
    step: 3,
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "#10b981",
    bg: "#d1fae5",
    icon: "🎉",
    tailwindBg: "bg-emerald-100",
    tailwindText: "text-emerald-700",
    step: 4,
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "❌",
    tailwindBg: "bg-red-100",
    tailwindText: "text-red-700",
    step: -1,
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

// สถานะถัดไปสำหรับ Counter
const NEXT_STATUS: Partial<Record<TStatus, TStatus>> = {
  PENDING: "RECEIVED",
  RECEIVED: "CONFIRMED",
  CONFIRMED: "APPOINTED",
  APPOINTED: "COMPLETED",
};

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

// ─── Sub Components ────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: TStatus }) => {
  const c = STATUS_CONFIG[status];
  if (!c) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${c.tailwindBg} ${c.tailwindText}`}
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
    <div className="flex items-center w-full">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const cfg = STATUS_CONFIG[s];
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? "text-white border-transparent"
                    : "bg-gray-100 border-gray-200 text-gray-400"
                }`}
                style={
                  done
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : {}
                }
              >
                {done ? (isCurrent ? cfg.icon : "✓") : i + 1}
              </motion.div>
              <span
                className="text-[9px] font-semibold whitespace-nowrap"
                style={{ color: done ? cfg.color : "#9ca3af" }}
              >
                {cfg.label}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-3 rounded-full transition-colors duration-500"
                style={{
                  backgroundColor:
                    i < currentIdx
                      ? STATUS_CONFIG[STATUS_ORDER[i]].color
                      : "#e5e7eb",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
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
  const sc = STATUS_CONFIG[data.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden border-2 ${
        selected
          ? "border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100"
          : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-gray-200"
      }`}
    >
      {/* Status left border indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: sc?.color || "#e5e7eb" }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">
              {SPECIES_EMOJI[data.pet?.species] || "🐾"}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">
                {data.pet?.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{data.title}</p>
            </div>
          </div>
          <StatusPill status={data.status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
            {data.serviceCode}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {data.referenceNo}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 border-t border-dashed border-gray-100 pt-2">
          <span>🏥 {data.hospital?.name}</span>
          <span>{fmtDate(data.createdAt)}</span>
        </div>
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
  onSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayTH = new Date().toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);
      formData.append("category", "HISTORY"); // ใบนัดจัดอยู่ในหมวด HISTORY

      console.log("Uploading file", ...formData);

      // TODO: เรียก API Upload จริง
      // await uploadMedicalFile(formData);

      // await new Promise((r) => setTimeout(r, 1500)); // mock delay
      // onSuccess();
      // onClose();
    } catch (err) {
      console.error("Upload failed", err);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                  📄
                </div>
                <div>
                  <h3 className="font-bold text-lg">อัปโหลดใบนัด</h3>
                  <p className="text-xs text-cyan-100">
                    เจ้าหน้าที่:{" "}
                    <span className="font-semibold text-white">
                      {firstName} {lastName}
                    </span>{" "}
                    · {todayTH}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-cyan-400 bg-cyan-50"
                  : file
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
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
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-bold text-teal-700 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtBytes(file.size)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                  >
                    เอาออก
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">☁️</div>
                  <p className="text-sm font-semibold text-gray-600">
                    ลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    หรือคลิกเพื่อเลือกไฟล์ PDF
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  "📤 อัปโหลดใบนัด"
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
  const nc = STATUS_CONFIG[nextStatus];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let notes = defaultNote ?? "";
      if (nc.label === "ยืนยันแล้ว") {
        notes = `สัตวแพทย์ชื่อ ${note}`;
      }

      await onConfirm(notes);
      onClose();
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ backgroundColor: nc.bg }}
            >
              {nc.icon}
            </motion.div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-1">
              เปลี่ยนสถานะเคส
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-mono text-gray-700">{caseRef}</span>
            </p>
            <div className="flex items-center justify-center gap-2 my-3">
              <StatusPill status={currentStatus} />
              <span className="text-gray-400">→</span>
              <StatusPill status={nextStatus} />
            </div>
            <textarea
              value={note}
              disabled={nc.label === "รับเคสแล้ว" || nc.label === "นัดหมายแล้ว"}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ใส่ชื่อสัตววแพทย์ที่รับเคส"
              className="w-full mt-2 p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 placeholder-gray-300"
              rows={1}
            />
          </div>
          <div className="flex border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-4 text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: nc.color }}
            >
              {loading ? "กำลังบันทึก..." : "ยืนยัน"}
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
  userLogin,
}: {
  data: CaseItem | null;
  onClose: () => void;
  onStatusUpdate: (
    id: string,
    newStatus: TStatus,
    note: string,
  ) => Promise<void>;
  userLogin: any;
}) => {
  const [tab, setTab] = useState("overview");
  const [showUpload, setShowUpload] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    setTab("overview");
  }, [data?.id]);

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-white text-gray-400 gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="text-7xl"
        >
          🐾
        </motion.div>
        <div className="text-center">
          <p className="font-bold text-gray-500 text-lg">
            เลือกเคสเพื่อดูรายละเอียด
          </p>
          <p className="text-sm text-gray-400 mt-1">คลิกที่รายการทางซ้ายมือ</p>
        </div>
      </div>
    );

  const nextStatus = NEXT_STATUS[data.status];
  const canAdvance =
    !!nextStatus && data.status !== "COMPLETED" && data.status !== "CANCELLED";
  const canCancel = data.status !== "COMPLETED" && data.status !== "CANCELLED";

  const tabs = [
    { id: "overview", label: "ภาพรวม", icon: "📋" },
    { id: "timeline", label: "ประวัติ", icon: "📜" },
    {
      id: "appointments",
      label: `นัดหมาย`,
      icon: "📅",
      count: data.appointments?.length || 0,
    },
    {
      id: "files",
      label: "เอกสาร",
      icon: "📂",
      count: data.medicalFiles?.length || 0,
    },
  ];

  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col bg-white"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="p-5 pb-0">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shadow-sm">
                {SPECIES_EMOJI[data.pet?.species] || "🐾"}
              </div>
              <div>
                <h2 className="font-extrabold text-xl text-gray-900 leading-tight">
                  {data.pet?.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {data.pet?.species === "Exotic"
                    ? data.pet?.exoticdescription || data.pet?.breed
                    : data.pet?.breed}{" "}
                  · {data.pet?.sex === "M" ? "♂" : "♀"} · {data.pet?.age}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusPill status={data.status} />
                  <span className="text-[10px] font-mono text-gray-400">
                    {data.referenceNo}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="pb-4">
            <StepTracker status={data.status} />
          </div>

          {/* Counter Action Buttons */}
          <div className="flex gap-2 pb-4">
            {/* Upload ใบนัด */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-semibold border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              <span>📤</span> อัปโหลดใบนัด
            </button>

            {/* Advance Status */}
            {canAdvance && nextStatus && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: STATUS_CONFIG[nextStatus].color }}
              >
                <span>{STATUS_CONFIG[nextStatus].icon}</span>
                เปลี่ยนเป็น "{STATUS_CONFIG[nextStatus].label}"
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-semibold border border-red-100 hover:bg-red-100 transition-colors"
              >
                ❌
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-t border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  tab === t.id
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className="ml-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-4"
            >
              <Section title="📋 รายละเอียดเคส">
                <Row label="หัวข้อ" value={data.title} />
                <Row label="รายละเอียด" value={data.description || "-"} />
                <Row
                  label="ประเภท"
                  value={
                    TYPE_CONFIG[data.referralType]?.label || data.referralType
                  }
                />
                <Row
                  label="บริการ"
                  value={`${data.serviceCode} · ${data.serviceReferral?.name}`}
                />
                <Row label="วันที่ส่งตัว" value={fmtDate(data.createdAt)} />
                <Row label="อัปเดตล่าสุด" value={fmtDate(data.updatedAt)} />
                {data.closedAt && (
                  <Row label="วันที่ปิดเคส" value={fmtDate(data.closedAt)} />
                )}
                {data.resultSummary && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                    <span className="font-bold">🎯 สรุปผล:</span>{" "}
                    {data.resultSummary}
                  </div>
                )}
              </Section>

              <Section title="🏥 โรงพยาบาลต้นทาง">
                <Row label="สถานพยาบาล" value={data.hospital?.name || "-"} />
                <Row
                  label="สัตวแพทย์"
                  value={`${data.veterinarian?.firstName || ""} ${data.veterinarian?.lastName || ""}`}
                />
                <Row
                  label="เบอร์ติดต่อ"
                  value={data.veterinarian?.phone || "-"}
                />
              </Section>

              <Section title="🐾 ข้อมูลเจ้าของ">
                <Row
                  label="ชื่อ-นามสกุล"
                  value={
                    data?.pet?.owner?.firstName +
                    " " +
                    data?.pet?.owner?.lastName
                  }
                />
                <Row
                  label="เบอร์ติดต่อ"
                  value={`${data.pet?.owner?.phone || ""}`}
                />
              </Section>

              <Section title="🐾 ข้อมูลสัตว์เลี้ยง">
                <Row label="ชื่อ" value={data.pet?.name} />
                <Row
                  label="ชนิด / พันธุ์"
                  value={
                    data.pet?.species === "Exotic"
                      ? `${data.pet?.exoticdescription || "Exotic"} (${data.pet?.breed})`
                      : `${data.pet?.species} / ${data.pet?.breed}`
                  }
                />
                <Row
                  label="เพศ / อายุ"
                  value={`${data.pet?.sex === "M" ? "ชาย" : "หญิง"} / ${data.pet?.age}`}
                />
                <Row label="สี" value={data.pet?.color} />
                <Row label="น้ำหนัก" value={`${data.pet?.weight} กก.`} />
              </Section>
            </motion.div>
          )}

          {tab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 relative pl-10"
            >
              <div className="absolute left-8 top-5 bottom-5 w-0.5 bg-gray-200" />
              {data.caseStatusLogs && data.caseStatusLogs.length > 0 ? (
                [...data.caseStatusLogs]
                  .reverse()
                  .map((log: any, i: number) => {
                    const nc = STATUS_CONFIG[log.newStatus as TStatus];
                    return (
                      <motion.div
                        key={log.id || i}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative flex gap-4 mb-5"
                      >
                        <div
                          className="z-10 w-9 h-9 -ml-4 rounded-full flex items-center justify-center text-sm border-2 bg-white flex-shrink-0"
                          style={{ borderColor: nc?.color, color: nc?.color }}
                        >
                          {nc?.icon || "?"}
                        </div>
                        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400">
                              {STATUS_CONFIG[log.oldStatus as TStatus]?.label ||
                                log.oldStatus}
                            </span>
                            <span className="text-gray-300 text-xs">→</span>
                            <StatusPill status={log.newStatus} />
                          </div>
                          {log.note && (
                            <p className="text-sm text-gray-600 mt-1.5">
                              {log.note}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            {fmtDate(log.createdAt)} · {fmtTime(log.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
              ) : (
                <Empty icon="📭" text="ไม่มีประวัติสถานะ" />
              )}
            </motion.div>
          )}

          {tab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-3"
            >
              {data.appointments && data.appointments.length > 0 ? (
                data.appointments.map((apt: any, i: number) => (
                  <motion.div
                    key={apt.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {i + 1}
                        </div>
                        <span className="font-semibold text-sm text-gray-700">
                          ใบนัดหมาย #{String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          // TODO: download appointment PDF
                        }}
                        className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-teal-100 transition-colors border border-teal-100"
                      >
                        ⬇️ ดาวน์โหลด
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 text-sm bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100">
                        📅 {apt.date ? fmtDate(apt.date) : "-"}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
                        🕐 {apt.date ? fmtTime(apt.date) : "-"}
                      </span>
                    </div>
                    {apt.note && (
                      <div className="mt-3 text-sm text-gray-600 bg-amber-50/60 rounded-xl p-3 border border-amber-100">
                        📝 {apt.note}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <Empty
                  icon="📅"
                  text="ยังไม่มีนัดหมาย"
                  sub="สามารถอัปโหลดใบนัดได้ที่ปุ่ม 'อัปโหลดใบนัด'"
                />
              )}
            </motion.div>
          )}

          {tab === "files" && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-3"
            >
              {data.medicalFiles?.length > 0 && (
                <div className="flex justify-end mb-1">
                  <CoverPDF
                    medicalFiles={data.medicalFiles}
                    baseUrl={import.meta.env.VITE_API_BASE_URL_FILE}
                    outputFileName="medical-record.pdf"
                  />
                </div>
              )}
              {data.medicalFiles && data.medicalFiles.length > 0 ? (
                data.medicalFiles
                  // เพิ่มการ Filter เพื่อไม่เอา APPOINTMENT
                  .filter((f: any) => f.category !== "APPOINTMENT")
                  .map((f: any) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl border border-indigo-100 flex-shrink-0">
                        {
                          f.category === "HISTORY"
                            ? "📄"
                            : f.category === "LAB"
                              ? "🧪"
                              : f.category === "XRAY"
                                ? "🩻"
                                : f.category === "PHOTO"
                                  ? "📷"
                                  : f.category === "BIOPSY"
                                    ? "🔬"
                                    : "📁" /* กรณีอื่นๆ */
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {f.originalName || f.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {f.category} · {fmtBytes(f.sizeBytes)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          window.open(
                            `${import.meta.env.VITE_API_BASE_URL_FILE}${f.fileUrl}`,
                            "_blank",
                          )
                        }
                        className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100"
                      >
                        ⬇️ ดาวน์โหลด
                      </button>
                    </div>
                  ))
              ) : (
                <Empty
                  icon="📂"
                  text="ไม่มีเอกสาร"
                  sub="กดปุ่ม 'อัปโหลดใบนัด' เพื่อเพิ่มไฟล์"
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
          firstName={data?.firstName ?? ""}
          lastName={data?.lastName ?? ""}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            // TODO: refresh case data
          }}
        />
      )}

      {showConfirm && nextStatus && (
        <ConfirmStatusModal
          currentStatus={data.status}
          nextStatus={nextStatus}
          caseRef={data.referenceNo}
          defaultNote={
            nextStatus === "RECEIVED"
              ? `เจ้าหน้าที่ชื่อ ${userLogin?.firstName || ""} ${userLogin?.lastName || ""}`
              : nextStatus === "APPOINTED"
                ? `เจ้าหน้าที่ชื่อ ${userLogin?.firstName || ""} ${userLogin?.lastName || ""} ออกใบนัด วันที่ ${new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}`
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
          caseRef={data.referenceNo}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={async (note) => {
            await onStatusUpdate(data.id, "CANCELLED", note);
          }}
        />
      )}
    </motion.div>
  );
};

// ─── Helper Sub Components ────────────────────────────────────────────────────
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
    <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 font-bold text-sm text-gray-600">
      {title}
    </div>
    <div className="p-4 space-y-2.5">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-400 w-28 shrink-0 font-medium">{label}</span>
    <span className="text-gray-700 font-semibold">{value}</span>
  </div>
);

const Empty = ({
  icon,
  text,
  sub,
}: {
  icon: string;
  text: string;
  sub?: string;
}) => (
  <div className="text-center py-14 text-gray-400">
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-sm font-semibold text-gray-500">{text}</p>
    {sub && (
      <p className="text-xs mt-1 text-gray-400 max-w-xs mx-auto">{sub}</p>
    )}
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

  // console.log("userLogin: ", userLogin);

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

  const handleSearch = () => {
    let s = startDate
      ? `${startDate}T00:00:00.000Z`
      : getStartOfDay(new Date());
    let e = endDate ? `${endDate}T23:59:59.999Z` : getEndOfDay(new Date());
    if (startDate && !endDate) e = `${startDate}T23:59:59.999Z`;
    else if (!startDate && endDate) s = `${endDate}T00:00:00.000Z`;
    fetchDataCases(s, e);
  };

  // Update status locally after API call
  const handleStatusUpdate = async (
    id: string,
    newStatus: TStatus,
    note: string,
  ) => {
    // สร้าง note อัตโนมัติตามสถานะ ถ้า Counter ไม่ได้พิมพ์มาเอง
    const autoNote = (() => {
      if (newStatus === "RECEIVED") {
        return (
          note.trim() ||
          `เจ้าหน้าที่ชื่อ ${userLogin?.firstName} ${userLogin?.lastName}`
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

    // await fetchDataCases(getStartOfDay(new Date()), getEndOfDay(new Date()));

    // Mock update locally
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
        c.referenceNo.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.pet?.name.toLowerCase().includes(q);
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
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* ─── Sidebar ─── */}
      <div className="w-[380px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm z-10">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
              🐾
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight">
                Counter Dashboard
              </h1>
              <p className="text-xs text-indigo-200">
                ระบบจัดการการส่งตัวสัตว์ป่วย
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-2.5 text-indigo-300 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสัตว์, เลขอ้างอิง..."
              className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TStatus | "ALL")}
            className="w-full mb-3 p-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none"
          >
            <option value="ALL" className="text-gray-800">
              ทุกสถานะ
            </option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s} className="text-gray-800">
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[10px] text-indigo-300 block mb-1">
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
              <label className="text-[10px] text-indigo-300 block mb-1">
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

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full py-2 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                กำลังโหลด...
              </>
            ) : (
              "🔍 ค้นหาตามช่วงเวลา"
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="p-3 flex gap-1.5 flex-wrap border-b border-gray-100 bg-gray-50/50">
          {STATUS_ORDER.map((st) => {
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() =>
                  setFilterStatus(filterStatus === st ? "ALL" : st)
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  filterStatus === st
                    ? `${cfg.tailwindBg} ${cfg.tailwindText} shadow-sm`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    filterStatus === st ? `${cfg.color}40` : undefined,
                }}
              >
                <span>{cfg.icon}</span>
                <span>{stats[st]}</span>
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-gray-400 self-center">
            {filtered.length} รายการ
          </span>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-10 h-10 border-b-2 border-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.length === 0 ? (
                <Empty icon="📭" text="ไม่พบข้อมูล" />
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

      {/* ─── Main Content ─── */}
      <div className="flex-1 relative overflow-hidden">
        <DetailPanel
          data={selectedCase}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          userLogin={userLogin}
        />
      </div>
    </div>
  );
}
