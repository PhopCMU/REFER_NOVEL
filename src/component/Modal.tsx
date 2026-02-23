import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  FlaskConical,
  Scan,
  Camera,
  Microscope,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Trash2,
  Plus,
  Scale,
  Calendar,
  Droplets,
} from "lucide-react";
import type { FormOwnerProp, FormPetProp, FormVetProp } from "../types/type";

// ─── Types ───────────────────────────────────────────────────────────────────

type MedicalFileCategory = "HISTORY" | "LAB" | "XRAY" | "PHOTO" | "BIOPSY";

interface UploadedFile {
  id: string;
  category: MedicalFileCategory;
  file: File;
  name: string;
  mimeType: string;
  sizeBytes: number;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

interface LabResultEntry {
  title: string;
  description: string;
  resultData: string;
}

interface UploadFilePetModalProps {
  pet: FormPetProp;
  owner: FormOwnerProp;
  vet: FormVetProp; // เปลี่ยนจาก any เป็น type ที่ชัดเจน
  onClose: () => void;
  onSubmit: (
    files: UploadedFile[],
    labResults: Record<string, LabResultEntry[]>,
  ) => void;
}

// ─── Category Config ──────────────────────────────────────────────────────────
// (ส่วนนี้คงเดิม - ไม่เปลี่ยนแปลง)
const CATEGORIES: {
  key: MedicalFileCategory;
  label: string;
  labelTH: string;
  icon: React.ElementType;
  required: boolean;
  accept: string;
  onlyFor?: string;
  description: string;
}[] = [
  {
    key: "HISTORY",
    label: "Medical History",
    labelTH: "ประวัติการรักษา",
    icon: FileText,
    required: true,
    accept: "application/pdf",
    description: "ประวัติการรักษาเดิม (PDF เท่านั้น)",
  },
  {
    key: "LAB",
    label: "Lab Results",
    labelTH: "ผลแล็บ / ผลเลือด",
    icon: FlaskConical,
    required: false,
    accept: "application/pdf,image/*",
    description: "ผลการตรวจทางห้องปฏิบัติการ",
  },
  {
    key: "XRAY",
    label: "X-Ray",
    labelTH: "X-Ray",
    icon: Scan,
    required: false,
    accept: "image/*,application/pdf",
    description: "ภาพถ่ายรังสี X-ray",
  },
  {
    key: "PHOTO",
    label: "Photos",
    labelTH: "ภาพถ่าย",
    icon: Camera,
    required: false,
    accept: "image/*",
    description: "ภาพถ่ายอาการ / รอยโรค",
  },
  {
    key: "BIOPSY",
    label: "Biopsy",
    labelTH: "ผลชิ้นเนื้อ",
    icon: Microscope,
    required: false,
    accept: "application/pdf,image/*",
    description: "ผลการตรวจชิ้นเนื้อ (เฉพาะ ONC)",
    onlyFor: "ONC",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
// (DropZone, FileCard, LabResultForm - คงเดิม ไม่เปลี่ยนแปลง)

function DropZone({
  category,
  accept,
  onFiles,
}: {
  category: MedicalFileCategory;
  accept: string;
  onFiles: (files: File[], cat: MedicalFileCategory) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files, category);
    },
    [category, onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200 py-6 px-4
        ${dragging ? "border-emerald-400 bg-emerald-50 scale-[1.01]" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}
      `}
    >
      <Upload
        className={`w-6 h-6 ${dragging ? "text-emerald-500" : "text-slate-400"}`}
      />
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        <span className="font-semibold text-emerald-600">
          คลิกเพื่อเลือกไฟล์
        </span>
        <br />
        หรือลากไฟล์มาวางที่นี่
      </p>
      <p className="text-[10px] text-slate-400">
        {accept.replace(/application\//g, "").replace(/,/g, " / ")}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files, category);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function FileCard({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: (id: string) => void;
}) {
  const CatIcon =
    CATEGORIES.find((c) => c.key === file.category)?.icon ?? FileText;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white border border-slate-100 shadow-sm px-3 py-2.5 group">
      {file.preview ? (
        <img
          src={file.preview}
          alt=""
          className="w-9 h-9 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
          <CatIcon className="w-4 h-4 text-slate-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          {file.name}
        </p>
        <p className="text-[10px] text-slate-400">
          {formatBytes(file.sizeBytes)}
        </p>
        {file.status === "uploading" && (
          <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>
      {file.status === "done" && (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      )}
      {file.status === "error" && (
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function LabResultForm({
  fileId,
  labResults,
  onChange,
}: {
  fileId: string;
  labResults: LabResultEntry[];
  onChange: (fileId: string, results: LabResultEntry[]) => void;
}) {
  const add = () =>
    onChange(fileId, [
      ...labResults,
      { title: "", description: "", resultData: "" },
    ]);
  const update = (i: number, field: keyof LabResultEntry, val: string) => {
    const next = labResults.map((r, idx) =>
      idx === i ? { ...r, [field]: val } : r,
    );
    onChange(fileId, next);
  };
  const remove = (i: number) =>
    onChange(
      fileId,
      labResults.filter((_, idx) => idx !== i),
    );

  return (
    <div className="mt-3 space-y-3">
      {labResults.map((r, i) => (
        <div
          key={i}
          className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-2 relative"
        >
          <button
            onClick={() => remove(i)}
            className="absolute top-2 right-2 text-slate-300 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <input
            placeholder="หัวข้อผลแล็บ *"
            value={r.title}
            onChange={(e) => update(i, "title", e.target.value)}
            className="w-full text-xs rounded-md border border-blue-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
          />
          <input
            placeholder="คำอธิบาย (ไม่บังคับ)"
            value={r.description}
            onChange={(e) => update(i, "description", e.target.value)}
            className="w-full text-xs rounded-md border border-blue-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
          />
          <textarea
            placeholder="ข้อมูลผลลัพธ์ / ค่า (JSON หรือข้อความ)"
            value={r.resultData}
            onChange={(e) => update(i, "resultData", e.target.value)}
            rows={2}
            className="w-full text-xs rounded-md border border-blue-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white resize-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> เพิ่มรายการผลแล็บ
      </button>
    </div>
  );
}

export default function UploadFilePetModal({
  pet,
  owner,
  vet,
  onClose,
  onSubmit,
}: UploadFilePetModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [labResults, setLabResults] = useState<
    Record<string, LabResultEntry[]>
  >({});

  const [activeCategory, setActiveCategory] =
    useState<MedicalFileCategory>("HISTORY");
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (files: File[], category: MedicalFileCategory) => {
    const newEntries: UploadedFile[] = files.map((file) => {
      const entry: UploadedFile = {
        id: uid(),
        category,
        file,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        status: "pending",
        progress: 0,
      };
      if (file.type.startsWith("image/")) {
        entry.preview = URL.createObjectURL(file);
      }
      return entry;
    });
    setUploadedFiles((prev) => [...prev, ...newEntries]);
  };

  console.log(pet);

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
    setLabResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateLabResults = (fileId: string, results: LabResultEntry[]) => {
    setLabResults((prev) => ({ ...prev, [fileId]: results }));
  };

  const historyUploaded = uploadedFiles.some((f) => f.category === "HISTORY");
  const canSubmit = historyUploaded && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulate upload - ใน Production ให้เปลี่ยนเป็น API call จริง
    for (const f of uploadedFiles) {
      setUploadedFiles((prev) =>
        prev.map((p) =>
          p.id === f.id ? { ...p, status: "uploading", progress: 0 } : p,
        ),
      );
      await new Promise((res) => setTimeout(res, 400));
      setUploadedFiles((prev) =>
        prev.map((p) =>
          p.id === f.id ? { ...p, status: "done", progress: 100 } : p,
        ),
      );
    }
    onSubmit(uploadedFiles, labResults);
    setSubmitting(false);
  };

  const activeCatFiles = uploadedFiles.filter(
    (f) => f.category === activeCategory,
  );
  const activeCatConfig = CATEGORIES.find((c) => c.key === activeCategory)!;

  // Helper: แปลง species เป็น icon/label ที่สวยงาม
  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case "cat":
        return "🐱";
      case "dog":
        return "🐶";
      case "bird":
        return "🐦";
      case "rabbit":
        return "🐰";
      default:
        return "🐾";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 font-[system-ui] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animal avatar with species emoji */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-inner flex-shrink-0 text-xl">
              {/* {getSpeciesIcon(pet.species)} */}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  {pet?.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {pet.breed}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 flex-wrap">
                <span className="text-slate-400">เจ้าของ:</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="font-medium text-slate-600">
                  {owner.firstName} {owner.lastName}
                </span>
                <span className="text-slate-300 mx-1">•</span>
                <span className="text-slate-500">{owner.phone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case ID & Pet Info Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <p className="text-slate-400">
              Case ID:{" "}
              <span className="font-mono text-slate-600 font-medium">
                {pet.animal_codeId}
              </span>
            </p>
            <span className="text-slate-300">|</span>
            <p className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3 h-3" /> {pet.age}
            </p>
            <p className="flex items-center gap-1 text-slate-500">
              <Scale className="w-3 h-3" /> {pet.weight} กก.
            </p>
            <p className="flex items-center gap-1 text-slate-500">
              <Droplets className="w-3 h-3" /> {pet.color}
            </p>
            {pet.sterilization === "YES" && (
              <>
                <span className="text-slate-300">|</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-medium">
                  ทำหมันแล้ว
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 gap-5">
        {/* Active category panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
            {/* Left: drop zone + info */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeCatConfig.required ? "bg-emerald-50" : "bg-slate-100"}`}
                  >
                    <activeCatConfig.icon
                      className={`w-5 h-5 ${activeCatConfig.required ? "text-emerald-600" : "text-slate-500"}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800">
                        {activeCatConfig.labelTH}
                      </h2>
                      {activeCatConfig.required && (
                        <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-500 uppercase">
                          บังคับ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCatConfig.description}
                    </p>
                  </div>
                </div>
                <DropZone
                  category={activeCategory}
                  accept={activeCatConfig.accept}
                  onFiles={handleFiles}
                />
              </div>

              {/* Validation summary */}
              {!historyUploaded && (
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    กรุณาอัพโหลด{" "}
                    <span className="font-bold">ประวัติการรักษา (HISTORY)</span>{" "}
                    ก่อนส่งเคส
                  </p>
                </div>
              )}
            </div>

            {/* Right: uploaded files list */}
            <div className="space-y-3">
              {activeCatFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <activeCatConfig.icon className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">ยังไม่มีไฟล์ในหมวดนี้</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                    ไฟล์ที่อัพโหลด ({activeCatFiles.length})
                  </p>
                  {activeCatFiles.map((f) => (
                    <div key={f.id}>
                      <FileCard file={f} onRemove={removeFile} />
                      {activeCategory === "LAB" && (
                        <LabResultForm
                          fileId={f.id}
                          labResults={labResults[f.id] ?? []}
                          onChange={updateLabResults}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* All files summary */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    สรุปไฟล์ทั้งหมด
                  </p>
                  <div className="space-y-1.5">
                    {CATEGORIES.map((cat) => {
                      const cnt = uploadedFiles.filter(
                        (f) => f.category === cat.key,
                      ).length;
                      if (cnt === 0 && !cat.required) return null;
                      return (
                        <div
                          key={cat.key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span
                            className={`${cnt === 0 && cat.required ? "text-red-500" : "text-slate-600"}`}
                          >
                            {cat.labelTH}
                            {cat.required ? " *" : ""}
                          </span>
                          <span
                            className={`font-semibold ${cnt > 0 ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {cnt > 0 ? `${cnt} ไฟล์` : "ยังไม่มี"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length} ไฟล์ • ${formatBytes(uploadedFiles.reduce((s, f) => s + f.sizeBytes, 0))}`
              : "ยังไม่มีไฟล์"}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                canSubmit
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  กำลังอัพโหลด...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  ส่งเอกสาร
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
