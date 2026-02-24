// constants/medical-file-categories.ts

import { FileText, FlaskConical, Scan, Camera, Microscope } from "lucide-react";
import type { MedicalFileCategoryConfig } from "../types/type";

export const MEDICAL_FILE_CATEGORIES: MedicalFileCategoryConfig[] = [
  {
    key: "HISTORY",
    label: "Medical History",
    labelTH: "ประวัติการรักษา",
    icon: FileText,
    required: true,
    accept: "application/pdf",
    description: "ประวัติการรักษาเดิม (PDF เท่านั้น)",
    maxFiles: 5,
    maxSizeMB: 25,
  },
  {
    key: "LAB",
    label: "Lab Results",
    labelTH: "ผลแล็บ / ผลเลือด",
    icon: FlaskConical,
    required: false,
    accept:
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*",
    description: "ผลการตรวจทางห้องปฏิบัติการ",
    maxFiles: 10,
    maxSizeMB: 50,
  },
  {
    key: "XRAY",
    label: "X-Ray",
    labelTH: "ภาพถ่ายรังสี",
    icon: Scan,
    required: false,
    accept: "image/*,application/pdf",
    description: "ภาพถ่ายรังสี X-ray, CT, MRI",
    maxFiles: 20,
    maxSizeMB: 100,
  },
  {
    key: "PHOTO",
    label: "Photos",
    labelTH: "ภาพถ่ายอาการ",
    icon: Camera,
    required: false,
    accept: "image/*",
    description: "ภาพถ่ายอาการ / รอยโรค / บาดแผล",
    maxFiles: 15,
    maxSizeMB: 20,
  },
  {
    key: "BIOPSY",
    label: "Biopsy",
    labelTH: "ผลชิ้นเนื้อ",
    icon: Microscope,
    required: false,
    accept: "application/pdf,image/*",
    description: "ผลการตรวจชิ้นเนื้อทางพยาธิวิทยา",
    onlyFor: "ONC",
    maxFiles: 5,
    maxSizeMB: 50,
  },
];

export function getCategoryConfig(key: string) {
  return MEDICAL_FILE_CATEGORIES.find((c) => c.key === key);
}

export function getCategoriesForSpecialty(specialty?: string) {
  return MEDICAL_FILE_CATEGORIES.filter(
    (cat) => !cat.onlyFor || cat.onlyFor === specialty,
  );
}
