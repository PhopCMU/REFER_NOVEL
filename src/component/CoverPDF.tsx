import React, { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { AnimatePresence, motion } from "framer-motion";

/* =========================================================
   TYPES
========================================================= */
export interface MedicalFile {
  id: string;
  fileUrl: string;
  mimeType: string;
  originalName?: string;
  category?: string;
}

interface CoverPDFProps {
  medicalFiles: MedicalFile[];
  baseUrl?: string;
  outputFileName?: string;
  onProgress?: (progress: number) => void;
}

/* =========================================================
   CONFIG
========================================================= */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/* =========================================================
   UTILS
========================================================= */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchArrayBufferWithRetry(
  url: string,
  retries = 3,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      if (i === retries) throw err;
      await sleep(500 * (i + 1));
    }
  }
  throw new Error("Unreachable");
}

function resolveFileUrl(fileUrl: string, baseUrl?: string) {
  if (!baseUrl) return fileUrl;
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${baseUrl}${fileUrl}`;
}

function fitIntoA4(width: number, height: number) {
  const ratio = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
  const w = width * ratio;
  const h = height * ratio;
  const x = (A4_WIDTH - w) / 2;
  const y = (A4_HEIGHT - h) / 2;
  return { w, h, x, y };
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================
   IMAGE NORMALIZATION (CRITICAL FOR PRODUCTION)

   Fixes:
   - SOI not found in JPEG
   - webp / gif / bmp / svg / tiff etc
   - wrong mime vs real data
   - unsupported formats in pdf-lib

   Strategy:
   Always convert to PNG via Canvas
========================================================= */

async function arrayBufferToDataURL(buffer: ArrayBuffer, mime: string) {
  const blob = new Blob([buffer], { type: mime });
  return URL.createObjectURL(blob);
}

async function normalizeImageToPng(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = await arrayBufferToDataURL(buffer, mimeType);

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context failed");

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return reject("Canvas blob failed");

          blob.arrayBuffer().then((ab) => {
            URL.revokeObjectURL(url);
            resolve(new Uint8Array(ab));
          });
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Image decode failed");
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function isPdfMime(mime: string) {
  return mime === "application/pdf";
}

/* =========================================================
   CORE MERGE ENGINE
========================================================= */

async function mergeMedicalFilesToPDF(options: {
  files: MedicalFile[];
  baseUrl?: string;
  signal?: AbortSignal;
  onProgress?: (p: number) => void;
}) {
  const { files, baseUrl, signal, onProgress } = options;

  // ✅ กรองไฟล์ APPOINTMENT ออกก่อนประมวลผล
  const filteredFiles = files.filter((f) => f.category !== "APPOINTMENT");

  if (filteredFiles.length === 0) {
    throw new Error("No valid files to merge (APPOINTMENT files excluded)");
  }

  const mergedPdf = await PDFDocument.create();

  let processed = 0;
  const total = filteredFiles.length;

  for (const file of filteredFiles) {
    // ✅ ใช้ filteredFiles แทน files
    if (signal?.aborted) throw new Error("PDF generation cancelled");

    const url = resolveFileUrl(file.fileUrl, baseUrl);
    const buffer = await fetchArrayBufferWithRetry(url, 3, signal);

    /* ================= IMAGE ================= */
    if (isImageMime(file.mimeType)) {
      try {
        const pngBytes = await normalizeImageToPng(buffer, file.mimeType);

        const imgDoc = await PDFDocument.create();
        const image = await imgDoc.embedPng(pngBytes);

        const page = imgDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const { w, h, x, y } = fitIntoA4(image.width, image.height);

        page.drawImage(image, { x, y, width: w, height: h });

        const bytes = await imgDoc.save();
        const temp = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(temp, temp.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        console.warn("Image convert failed, skipped:", file.originalName);
      }
    } else if (isPdfMime(file.mimeType)) {
      /* ================= PDF ================= */
      try {
        const srcPdf = await PDFDocument.load(buffer, {
          ignoreEncryption: true,
        });

        const pages = await mergedPdf.copyPages(
          srcPdf,
          srcPdf.getPageIndices(),
        );
        pages.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        console.warn("PDF load failed, skipped:", file.originalName);
      }
    } else if (
      /* ================= OFFICE FILES ================= */
      file.mimeType.includes("word") ||
      file.mimeType.includes("excel")
    ) {
      console.warn(
        "Office file must be converted to PDF server-side:",
        file.originalName,
      );
    } else {
      console.warn("Unsupported file skipped:", file.originalName);
    }

    processed++;
    onProgress?.(Math.round((processed / total) * 100));
  }

  /* ================= PAGE NUMBERS ================= */
  const pages = mergedPdf.getPages();
  pages.forEach((page, i) => {
    page.drawText(`Page ${i + 1} / ${pages.length}`, {
      x: A4_WIDTH - 120,
      y: 20,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return mergedPdf.save();
}

/* =========================================================
   COMPONENT
========================================================= */

const CoverPDF: React.FC<CoverPDFProps> = ({
  medicalFiles,
  baseUrl,
  outputFileName = "medical-record.pdf",
  onProgress,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!medicalFiles?.length) return;

    setError(null);
    setLoading(true);
    setProgress(0);

    abortRef.current = new AbortController();

    try {
      const bytes = await mergeMedicalFilesToPDF({
        files: medicalFiles,
        baseUrl,
        signal: abortRef.current.signal,
        onProgress: (p) => {
          setProgress(p);
          onProgress?.(p);
        },
      });

      triggerDownload(bytes, outputFileName);
    } catch (err: any) {
      if (err.message !== "PDF generation cancelled") {
        console.error(err);
        setError("Failed to generate PDF");
        setTimeout(() => setError(""), 3000);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm w-full"
    >
      {/* Main Action Button */}
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        onClick={handleGenerate}
        disabled={loading}
        className={`
      relative overflow-hidden px-5 py-3 rounded-lg font-medium text-sm
      transition-all duration-200 shadow-sm
      ${
        loading
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-md"
      }
    `}
      >
        {/* Loading Progress Bar */}
        {loading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-500/30 to-indigo-500/30"
            style={{ backdropFilter: "blur(1px)" }}
          />
        )}

        {/* Button Content */}
        <div className="flex items-center justify-center gap-2 relative z-10">
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-blue-600"
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
              <span>กำลังสร้าง PDF {progress}%</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">
                file_present
              </span>
              <span>รวมไฟล์ดาวน์โหลด PDF</span>
              <span className="material-symbols-outlined text-base opacity-70">
                download
              </span>
            </>
          )}
        </div>
      </motion.button>

      {/* Cancel Button - Only show when loading */}
      <AnimatePresence>
        {loading && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">cancel</span>
            ยกเลิกการสร้าง PDF
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
          >
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
            <button
              onClick={() => {
                /* clear error logic */
              }}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Stats - Optional enhancement */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center text-xs text-gray-500 px-1"
        >
          <span>กำลังประมวลผลไฟล์...</span>
          <span className="font-mono">{progress}%</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CoverPDF;
