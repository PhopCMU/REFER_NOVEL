import type { AllowedMimeType, MedicalFileCategory } from "../types/type";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "tif",
  "tiff",
  "heic",
  "heif",
] as const;

const toMutable = <T>(arr: readonly T[]): T[] => [...arr];

export const CATEGORY_ALLOWED_TYPES: Record<
  MedicalFileCategory,
  AllowedMimeType[]
> = {
  HISTORY: ["application/pdf"],
  LAB: toMutable(ALLOWED_MIME_TYPES),
  XRAY: toMutable(ALLOWED_MIME_TYPES),
  PHOTO: toMutable(ALLOWED_MIME_TYPES.filter((t) => t.startsWith("image/"))),
  BIOPSY: toMutable(ALLOWED_MIME_TYPES),
};

export function isValidMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

export function isValidExtension(extension: string): boolean {
  const ext = extension.toLowerCase().replace(".", "");
  return ALLOWED_EXTENSIONS.includes(ext as any);
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  extension?: string;
}

export function validateFile(
  file: File,
  category: MedicalFileCategory,
  maxSizeMB: number = 50,
): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `ไฟล์มีขนาดใหญ่เกินกำหนด (${maxSizeMB} MB)`,
    };
  }

  if (!isValidMimeType(file.type)) {
    return {
      isValid: false,
      error: `ประเภทไฟล์ "${file.type}" ไม่ได้รับการรองรับ\nอนุญาตเฉพาะ: PDF, Word, Excel, และไฟล์รูปภาพ`,
    };
  }

  const ext = getFileExtension(file.name);
  if (!isValidExtension(ext)) {
    return {
      isValid: false,
      error: `นามสกุลไฟล์ ".${ext}" ไม่ได้รับการรองรับ`,
    };
  }

  const allowed = CATEGORY_ALLOWED_TYPES[category];
  if (!allowed.includes(file.type as AllowedMimeType)) {
    return {
      isValid: false,
      error: `หมวด "${category}" ไม่รองรับไฟล์ประเภทนี้`,
    };
  }

  return { isValid: true, extension: ext };
}
