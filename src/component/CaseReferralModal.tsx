// components/CaseReferralModal.tsx

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Trash2,
  Plus,
  Stethoscope,
  PawPrint,
  Search,
} from "lucide-react";
import {
  getCategoryConfig,
  getCategoriesForSpecialty,
  MEDICAL_FILE_CATEGORIES,
} from "../constants/medical-file-categories";
import { REFERRAL_SERVICES } from "../constants/referral-services";
import { validateFile } from "../libs/fileValidator";
import type {
  MedicalFileCategory,
  UploadedFile,
  LabResult,
  ServiceReferral,
  FormPetProp,
  FormOwnerProp,
  FormVetProp,
} from "../types/type";
import { LoadingForm } from "./LoadingForm";

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropZone({
  category,
  onFiles,
  onError,
}: {
  category: MedicalFileCategory;
  onFiles: (files: File[], cat: MedicalFileCategory) => void;
  onError?: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = getCategoryConfig(category);

  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];

      for (const file of files) {
        const validation = validateFile(
          file,
          category,
          config?.maxSizeMB || 50,
        );

        if (validation.isValid) {
          validFiles.push(file);
        } else {
          onError?.(`${file.name}: ${validation.error}`);
        }
      }

      if (validFiles.length > 0) {
        onFiles(validFiles, category);
      }
    },
    [category, onFiles, onError, config],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) handleFiles(files);
    },
    [handleFiles],
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
        ${
          dragging
            ? "border-emerald-400 bg-cyan-50 scale-[1.01]"
            : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
        }
      `}
    >
      <Upload
        className={`w-6 h-6 ${dragging ? "text-cyan-500" : "text-slate-400"}`}
      />
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        <span className="font-semibold text-cyan-600">คลิกเพื่อเลือกไฟล์</span>
        <br />
        หรือลากไฟล์มาวางที่นี่
      </p>
      <p className="text-[10px] text-slate-400 text-center max-w-50">
        {category === "HISTORY"
          ? "PDF เท่านั้น"
          : category === "PHOTO"
            ? "ไฟล์รูปภาพ: JPG, PNG, GIF, WebP"
            : "PDF, Word, Excel, รูปภาพ"}
        <br />
        <span className="text-slate-300">
          สูงสุด {config?.maxSizeMB || 50} MB/ไฟล์
        </span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={config?.accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) handleFiles(files);
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
  const CatIcon = getCategoryConfig(file.category)?.icon ?? FileText;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white border border-slate-100 shadow-sm px-3 py-2.5 group">
      {file.preview ? (
        <img
          src={file.preview}
          alt=""
          className="w-9 h-9 rounded object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center shrink-0">
          <CatIcon className="w-4 h-4 text-slate-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          {file.name}
        </p>
        <p className="text-[10px] text-slate-400">
          {(file.sizeBytes / 1024).toFixed(1)} KB
        </p>
        {file.status === "uploading" && (
          <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.error && (
          <p className="text-[10px] text-red-500 mt-1">{file.error}</p>
        )}
      </div>
      {file.status === "done" && (
        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
      )}
      {file.status === "error" && (
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
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
  labResults: LabResult[];
  onChange: (fileId: string, results: LabResult[]) => void;
}) {
  const add = () =>
    onChange(fileId, [
      ...labResults,
      {
        id: crypto.randomUUID(),
        medicalFileId: fileId,
        title: "",
        description: "",
        resultData: "",
        createdAt: new Date(),
      },
    ]);

  const update = (i: number, field: keyof LabResult, val: string) => {
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
          key={r.id || i}
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

function ServiceSelector({
  selectedServiceId,
  onSelect,
}: {
  selectedServiceId: string | null;
  onSelect: (service: ServiceReferral) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    return REFERRAL_SERVICES.filter(
      (s) =>
        s.isActive &&
        (s.nameTH.toLowerCase().includes(search.toLowerCase()) ||
          s.nameEN.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())),
    );
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาคลินิก..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={`
              p-3 rounded-xl border text-left transition-all duration-150
              ${
                selectedServiceId === service.id
                  ? "bg-cyan-50 border-emerald-300 ring-2 ring-emerald-500"
                  : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope
                className={`w-4 h-4 ${selectedServiceId === service.id ? "text-cyan-600" : "text-slate-400"}`}
              />
              <span className="text-md font-bold text-slate-700">
                {service.nameTH}
              </span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">
              {/* {service.nameEN} */}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface CaseReferralModalProps {
  pet: FormPetProp;
  owner: FormOwnerProp;
  vet: FormVetProp;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export default function CaseReferralModal({
  pet,
  owner,
  vet,
  isOpen,
  onClose,
  onSubmit,
}: CaseReferralModalProps) {
  const [selectedService, setSelectedService] =
    useState<ServiceReferral | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [labResults, setLabResults] = useState<Record<string, LabResult[]>>({});
  const [activeCategory, setActiveCategory] =
    useState<MedicalFileCategory>("HISTORY");
  const [submitting, setSubmitting] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [referralTitle, setReferralTitle] = useState("");
  const [referralDescription, setReferralDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string>("");

  // ✅ กรอง category ตาม service ที่เลือก (เช่น ONC จะเห็น BIOPSY)
  const visibleCategories = useMemo(() => {
    return getCategoriesForSpecialty(selectedService?.code);
  }, [selectedService]);

  const handleFiles = (files: File[], category: MedicalFileCategory) => {
    // const config = getCategoryConfig(category);
    const newEntries: UploadedFile[] = files.map((file) => {
      const entry: UploadedFile = {
        id: crypto.randomUUID(),
        category,
        file,
        name: file.name,
        mimeType: file.type,
        fileExtension: file.name.split(".").pop()?.toLowerCase() || "",
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

  const updateLabResults = (fileId: string, results: LabResult[]) => {
    setLabResults((prev) => ({ ...prev, [fileId]: results }));
  };

  const handleFileError = (message: string) => {
    setFileErrors((prev) => [...prev, message]);
    setTimeout(() => {
      setFileErrors((prev) => prev.slice(1));
    }, 5000);
  };

  const historyUploaded = uploadedFiles.some((f) => f.category === "HISTORY");
  const canSubmit =
    selectedService && historyUploaded && referralTitle.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setIsLoading(true);
    setMessages("กำลังส่งข้อมูล...");

    // ✅ 1. จำลองการอัพโหลด (UI Feedback)
    for (const f of uploadedFiles) {
      setUploadedFiles((prev) =>
        prev.map((p) =>
          p.id === f.id ? { ...p, status: "uploading", progress: 0 } : p,
        ),
      );
      await new Promise((res) => setTimeout(res, 300));
      setUploadedFiles((prev) =>
        prev.map((p) =>
          p.id === f.id ? { ...p, status: "done", progress: 100 } : p,
        ),
      );
    }

    // ✅ 2. เตรียม Metadata สำหรับเข้ารหัส (รวม category + name สำหรับจับคู่)
    const metadataPayload = {
      animal_codeId: pet.animal_codeId,
      owner_codeId: owner.owner_codeId,
      veterinarianId: vet.id,
      hospitalId: vet.hospitalId,
      serviceId: selectedService!.id,
      serviceCode: selectedService!.code,
      title: referralTitle,
      description: referralDescription,

      // ✅ ส่ง metadata ของไฟล์พร้อมข้อมูลสำหรับจับคู่กับ Database
      files: uploadedFiles.map((f, index) => ({
        clientIndex: index, // 🔑 ลำดับสำหรับจับคู่กับไฟล์ Binary
        category: f.category, // 🔑 MedicalFileCategory (HISTORY, LAB, etc.)
        name: f.name, // 🔑 originalName ใน Database
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        fileExtension: f.fileExtension,
        // Lab Results (ถ้ามี)
        labResults: labResults[f.id] ?? [],
      })),
      // Lab Results ที่ไม่เกี่ยวกับไฟล์ (ถ้ามี)
      globalLabResults: Object.entries(labResults)
        .filter(([fileId]) => !uploadedFiles.some((f) => f.id === fileId))
        .reduce(
          (acc, [fileId, results]) => ({ ...acc, [fileId]: results }),
          {},
        ),
    };

    // console.log(
    //   "🔍 Debug uploadedFiles:",
    //   uploadedFiles.map((f) => ({
    //     id: f.id,
    //     name: f.name,
    //     category: f.category,
    //     hasFile: f.file instanceof File,
    //     fileSize: f.file?.size,
    //   })),
    // );

    // ✅ 3. ดึง File Objects จริงๆ (แก้เป็น f.file ตามที่เก็บไว้ตอน handleFiles)
    const binaryFiles = uploadedFiles
      .map((f) => f.file) // ✅ ใช้ property "file" ที่เก็บไว้ตอน handleFiles
      .filter((f): f is File => f instanceof File);

    // console.log("📦 Encrypted Metadata:", {
    //   fileCount: metadataPayload.files.length,
    //   files: metadataPayload.files.map((f) => ({
    //     clientIndex: f.clientIndex,
    //     category: f.category,
    //     name: f.name,
    //   })),
    // });
    // console.log("📁 Binary Files count:", binaryFiles.length);
    // ส่ง payload ไปยัง API ในหน้า referral.tsx
    await onSubmit({ metadata: metadataPayload, files: binaryFiles });

    setMessages("ส่งข้อมูลเรียบร้อยแล้ว");
    setTimeout(() => {
      setIsLoading(false);
      setMessages("");
      setSubmitting(false);
      onClose();
    }, 1500);
  };

  const activeCatFiles = uploadedFiles.filter(
    (f) => f.category === activeCategory,
  );
  const activeCatConfig = getCategoryConfig(activeCategory);

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

  if (!isOpen) return null;

  if (isLoading) {
    return <LoadingForm text={messages} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* ── Header ── */}
          <div className="shrink-0 bg-linear-to-r from-cyan-500 to-blue-600 text-white">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  {getSpeciesIcon(pet.species)}
                </div>
                <div>
                  <h1 className="text-lg font-bold">{pet.name}</h1>
                  <p className="text-xs text-white/80 flex items-center gap-2 flex-wrap">
                    <span>{pet.breed}</span>
                    <span>•</span>
                    <span>{pet.age}</span>
                    <span>•</span>
                    <span>{pet.weight} กก.</span>
                    {pet.sterilization === "YES" && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">
                          ทำหมันแล้ว
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pet & Owner Info Bar */}
            <div className="px-6 pb-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                <p>
                  Case ID:{" "}
                  <span className="font-mono font-medium">
                    {pet.animal_codeId}
                  </span>
                </p>
                <span className="text-white/50">|</span>
                <p className="flex items-center gap-1">
                  <PawPrint className="w-3 h-3" /> {pet.color}
                </p>
                <span className="text-white/50">|</span>
                <p>
                  เจ้าของ:{" "}
                  <span className="font-medium">
                    {owner.firstName} {owner.lastName}
                  </span>
                </p>
                <span className="text-white/50">|</span>
                <p className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> {owner.phone}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Important info for vets */}
              <div
                role="note"
                aria-live="polite"
                className="mb-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                <div className="text-sm leading-tight">
                  <p className="font-semibold">การพิจารณา</p>
                  <p className="mt-1">
                    การพิจารณาเข้าคลินิกอยู่ภายใต้ความเห็นของสัตวแพทย์
                  </p>
                  <p className="mt-1 text-xs">
                    ช่องทางการติดต่อเพิ่มเติม:{" "}
                    <a
                      href="tel:053948031"
                      className="font-medium underline text-amber-800"
                    >
                      053-948-031
                    </a>
                    ,{" "}
                    <a
                      href="tel:053948112"
                      className="font-medium underline text-amber-800"
                    >
                      053-948-112
                    </a>{" "}
                    (ในช่วงเวลาทำการ)
                  </p>
                </div>
              </div>

              {/* Step 1: เลือกคลินิก */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-600">1</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    เลือกคลินิก/บริการที่ต้องการส่งต่อ
                  </h2>
                  {selectedService && (
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-cyan-100 text-blue-700 font-medium">
                      {selectedService.nameTH}
                    </span>
                  )}
                </div>
                <ServiceSelector
                  selectedServiceId={selectedService?.id || null}
                  onSelect={setSelectedService}
                />
              </div>

              {/* Step 2: ข้อมูลการส่งต่อ */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-600">2</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    ข้อมูลการส่งต่อ
                  </h2>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="หัวข้อการส่งต่อ *"
                    value={referralTitle}
                    onChange={(e) => setReferralTitle(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    value={referralDescription}
                    onChange={(e) => setReferralDescription(e.target.value)}
                    rows={3}
                    className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Step 3: อัพโหลดไฟล์ */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-600">3</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    อัพโหลดเอกสารทางการแพทย์
                  </h2>
                  {historyUploaded && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 ml-auto" />
                  )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                  {visibleCategories.map((cat) => {
                    const Icon = cat.icon;
                    const count = uploadedFiles.filter(
                      (f) => f.category === cat.key,
                    ).length;
                    const isActive = activeCategory === cat.key;
                    const hasRequired = cat.required && count === 0;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`
                          shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold
                          border transition-all duration-150 relative
                          ${
                            isActive
                              ? "bg-cyan-600 text-white border-emerald-600 shadow-md"
                              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-cyan-700"
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.labelTH}</span>
                        {count > 0 && (
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${isActive ? "bg-white text-cyan-700" : "bg-cyan-500 text-white"}`}
                          >
                            {count}
                          </span>
                        )}
                        {hasRequired && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Category Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left: Drop Zone */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeCatConfig?.required ? "bg-cyan-50" : "bg-slate-100"}`}
                        >
                          {activeCatConfig && (
                            <activeCatConfig.icon
                              className={`w-5 h-5 ${activeCatConfig.required ? "text-cyan-600" : "text-slate-500"}`}
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800">
                              {activeCatConfig?.labelTH}
                            </h3>
                            {activeCatConfig?.required && (
                              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-500 uppercase">
                                บังคับ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activeCatConfig?.description}
                          </p>
                        </div>
                      </div>
                      {activeCatConfig && (
                        <DropZone
                          category={activeCategory}
                          onFiles={handleFiles}
                          onError={handleFileError}
                        />
                      )}
                    </div>

                    {!historyUploaded && (
                      <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700">
                          กรุณาอัพโหลด{" "}
                          <span className="font-bold">
                            ประวัติการรักษา (HISTORY)
                          </span>{" "}
                          ก่อนส่งเคส
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: File List */}
                  <div className="space-y-3">
                    {activeCatFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        {activeCatConfig && (
                          <activeCatConfig.icon className="w-8 h-8 mb-2 opacity-30" />
                        )}
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

                    {/* File Summary */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          สรุปไฟล์ทั้งหมด
                        </p>
                        <div className="space-y-1.5">
                          {MEDICAL_FILE_CATEGORIES.map((cat) => {
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
                                  className={`font-semibold ${cnt > 0 ? "text-cyan-600" : "text-slate-400"}`}
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
          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} ไฟล์ • ${(uploadedFiles.reduce((s, f) => s + f.sizeBytes, 0) / 1024).toFixed(1)} KB`
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
                  className={`
                    px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-2
                    ${
                      canSubmit
                        ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-emerald-100 active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      กำลังอัพโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      ส่งการส่งต่อ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Error Toast ── */}
        <AnimatePresence>
          {fileErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-4 right-4 z-60 max-w-sm space-y-2"
            >
              {fileErrors.slice(-3).map((err, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 shadow-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 flex-1">{err}</p>
                  <button
                    onClick={() =>
                      setFileErrors((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-red-300 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
