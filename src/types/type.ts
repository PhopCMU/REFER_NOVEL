export interface FeedbackProps {
  rating: number;
  comment: string;
  recaptchaToken: string;
}

export interface WorkplacePayload {
  name: string;
  type: string | undefined;
  recaptchaToken: string;
}

export interface DataHospitalProps {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataFormSubmitProps {
  recaptchaToken: string;
  email: string;
  firstName: string;
  lastName: string;
  lineID: string;
  workplaces: string[];
  ceLicense: string;
  password: string;
  phone: string;
}

export interface DataFormLoginProps {
  recaptchaToken: string;
  email: string;
  password: string;
  selectedHospital: string;
}

export interface FormOwnerProp {
  id?: string;
  owner_codeId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  veterinarianId?: string;
  hospitalId?: string;
  animals?: FormPetProp[];
}

type animalSex = "M" | "F";
type SterilizationStatus = "YES" | "NO" | "UNKNOWN";
type PetType = "Dog" | "Cat" | "Exotic";

export interface FormPetProp {
  id?: string;
  ownerId: string;
  animal_codeId?: string;
  name: string; // ชื่อสัตว์
  color: string; // สี
  sex: animalSex; // เพศ
  weight?: string; // น้ำหนัก
  age: string; // อายุกำหนดห้ใส่ ปี + เดือน
  sterilization: SterilizationStatus; // ประวัติการทำหมัน
  species: PetType; // ชนิด
  exoticdescription?: string; // เพิ่มฟิลด์ exoticdescription ถ้า PetType เป็น Exotic เช่น เต๋า, สัตว์ป่า, กวาง
  breed?: string; // สายพันธุ์
}

export interface FormVetProp {
  id: string;
  vet_codeId: string;
  firstName: string;
  lastName: string;
  email: string;
  ceLicense: string;
  hospitalId: string;
  hospitalName: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
}

export interface PayloadCreatedOwner {
  address: string;
  email: string;
  firstName: string;
  lastName: string;
  hospitalId: string;
  phone: string;
  veterinarianId: string;
}

export interface PayloadUpdateOwner {
  id: string;
  address: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface PayloadFetchOwner {
  hospitalId: string;
  veterinarianId: string;
}

export interface PayloadSendLinkResetPassword {
  email: string;
  recaptchaToken: string;
}

export interface PayloadCheckOtpProps {
  id: string;
  otp: string;
  exp: string;
  recaptchaToken: string;
}

export interface PayloadResetPassword {
  id: string;
  password: string;
  email: string;
  vet_codeId: string;
  recaptchaToken: string;
}

// ─── Medical File Category ───────────────────────────────────────────────────
export type MedicalFileCategory =
  | "HISTORY"
  | "LAB"
  | "XRAY"
  | "PHOTO"
  | "BIOPSY"
  | "APPOINTMENT";

export interface MedicalFileCategoryConfig {
  key: MedicalFileCategory;
  label: string;
  labelTH: string;
  icon: React.ElementType;
  required: boolean;
  accept: string;
  description: string;
  onlyFor?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

// ─── Allowed File Types ──────────────────────────────────────────────────────
export type AllowedMimeType =
  | "application/pdf"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "image/jpeg"
  | "image/jpg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/bmp"
  | "image/svg+xml"
  | "image/tiff"
  | "image/heic"
  | "image/heif";

export type AllowedFileType =
  | "PDF"
  | "DOC"
  | "DOCX"
  | "XLS"
  | "XLSX"
  | "IMAGE_JPG"
  | "IMAGE_PNG"
  | "IMAGE_GIF"
  | "IMAGE_WEBP"
  | "IMAGE_BMP"
  | "IMAGE_SVG";

// ─── Medical File ────────────────────────────────────────────────────────────
export interface MedicalFile {
  id: string;
  caseId: string;
  category: MedicalFileCategory;
  name: string;
  originalName: string;
  mimeType: string;
  fileExtension: string;
  sizeBytes: number;
  fileUrl: string;
  fileKey?: string;
  fileType: AllowedFileType;
  isAllowed: boolean;
  fileHash?: string;
  uploadedBy: string;
  createdAt: Date;
  labResults?: LabResult[];
}

export interface LabResult {
  id: string;
  medicalFileId: string;
  title: string;
  description?: string;
  resultData?: string;
  createdAt: Date;
}

// ─── Service Referral (คลินิก) ───────────────────────────────────────────────
export interface ServiceReferral {
  id: string;
  code: string;
  nameTH: string;
  nameEN: string;
  description?: string;
  isActive: boolean;
  specialty?: string;
}

// ─── Uploaded File (Frontend State) ──────────────────────────────────────────
export interface UploadedFile {
  id: string;
  category: MedicalFileCategory;
  file: File;
  name: string;
  mimeType: string;
  fileExtension: string;
  sizeBytes: number;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

// ─── Case Referral Payload ───────────────────────────────────────────────────
export interface CaseReferralPayload {
  animal_codeId: string;
  owner_codeId: string;
  veterinarianId: string;
  hospitalId: string;
  serviceId: string;
  serviceCode: string;
  title: string;
  description?: string;
  files: Array<{
    category: MedicalFileCategory;
    name: string;
    mimeType: string;
    sizeBytes: number;
    fileExtension: string;
  }>;
  labResults: Record<string, LabResult[]>;
}

// ─── Case Referral Payload Ecrypted ───────────────────────────────────────────────────
export interface ReferralDataPayload {
  animal_codeId: string;
  owner_codeId: string;
  veterinarianId: string;
  hospitalId: string;
  serviceId: string;
  serviceCode: string;
  title: string;
  description: string;
  files: any[];
  labResults: Record<string, LabResult[]>; // หรือกำหนด Type ให้ชัดเจน
  // ไม่ต้องใส่ files ในส่วนนี้ เพราะเราจะแยกส่ง
}

// ─── Case Referral Payload Request ───────────────────────────────────────────────────
export interface PostReferralPayload {
  metadata: {
    animal_codeId: string;
    owner_codeId: string;
    veterinarianId: string;
    hospitalId: string;
    serviceId: string;
    serviceCode: string;
    title: string;
    description?: string;
    files: Array<{
      clientIndex: number; // 🔑 ลำดับสำหรับจับคู่
      category: string; // 🔑 MedicalFileCategory
      name: string; // 🔑 originalName
      mimeType: string;
      sizeBytes: number;
      fileExtension: string;
      labResults?: Array<{
        title: string;
        description?: string;
        resultData?: string;
      }>;
    }>;
  };
  files: File[]; // File Objects จริงๆ
}

export interface PostReferralPayloadEncrypted {
  caseId: string;
  files: File[]; // File Objects จริงๆ
  appointmentDateTime: string;
}

// ─── Case Referral Payload List data ───────────────────────────────────────────────────

// ─── Types & Interfaces ──────────────────────────────────────────────────────
export type TStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "APPOINTED"
  | "COMPLETED"
  | "CANCELLED";
export type TReferralType = "CONTINUOUS" | "SPECIALIST" | "ONE_TIME";

export interface GetReferralCasesProps {
  timeStart: string;
  timeEnd: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Veterinarian {
  id?: string;
  vet_codeId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
}

export interface Pet {
  id: string;
  animal_codeId: string;
  name: string;
  owner?: Veterinarian;
  color: string;
  sex: "M" | "F" | "UNKNOWN";
  weight: string;
  age: string;
  sterilization: string;
  species: "Dog" | "Cat" | "Exotic";
  breed: string;
  exoticdescription?: string | null; // มีในข้อมูลจริง
  ownerId: string;
}

export interface ServiceReferral {
  id: string;
  code: string;
  name: string;
}

export interface StatusLog {
  id: string;
  caseId: string;
  oldStatus: TStatus;
  newStatus: TStatus;
  changedBy: string | null;
  note: string;
  createdAt: string;
}

export interface CaseItem {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  serviceCode: string;
  status: TStatus;
  referralType: TReferralType;
  hospital: Hospital;
  veterinarian: Veterinarian;
  pet: Pet;
  serviceReferral: ServiceReferral;
  medicalFiles: MedicalFile[]; // มีในข้อมูลจริง
  caseStatusLogs: StatusLog[]; // มีในข้อมูลจริง
  appointments: any[]; // มีในข้อมูลจริง (เป็น array ว่าง)
  resultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
  // NOTE: ไม่มี field owner ใน root object จาก DB จริง
}

// --- CmuItAccount ---
export interface CmuItAccount {
  id?: string;
  cmuitaccount: string;
  cmuitaccount_name: string;
  firstname_EN: string;
  firstname_TH: string;
  itaccounttype_EN: string;
  itaccounttype_TH: string;
  itaccounttype_id?: string;
  lastname_EN: string;
  lastname_TH: string;
  organization_code: string;
  organization_name_EN: string;
  organization_name_TH: string;
  prename_EN: string;
  prename_TH: string;
  prename_id?: string;
  student_id?: string;
}

// --- Update Case Status ---
export interface UpdateCaseStatusProps {
  caseId: string;

  status: TStatus;
  note: string;
}

export interface ApiCaseData {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  referralType: string;
  status: string;
  serviceCode: string;
  createdAt: string;
  updatedAt: string;
  pet: {
    id: string;
    animal_codeId: string;
    name: string;
    species: string;
    breed: string;
    age: string;
    sex: string;
    color: string;
    weight: string;
    sterilization: string;
    exoticdescription: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      owner_codeId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      hospitalId: string;
      veterinarianId: string;
      address: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  hospital: {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };
  veterinarian: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  serviceReferral: {
    id: string;
    code: string;
    name: string;
  };
  medicalFiles: Array<{
    id: string;
    category: string;
    name: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    createdAt: string;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    note: string;
  }>;
  caseStatusLogs: Array<{
    id: string;
    oldStatus: string;
    newStatus: string;
    note: string;
    createdAt: string;
  }>;
}

export interface DashboardCase {
  id: string;
  referenceNo: string;
  title: string;
  referralType: string;
  status: string;
  serviceCode: string;
  serviceName: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petSex: string;
  petColor: string;
  petWeight: string;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  hospitalName: string;
  vetName: string;
  vetPhone: string;
  createdAt: string;
  updatedAt: string;
  appointments: number;
  medicalFiles: number;
  caseStatusLogs: Array<{
    oldStatus: string;
    newStatus: string;
    note: string;
    createdAt: string;
  }>;
}

// 🔁 ฟังก์ชันแปลงข้อมูลจาก API เป็นรูปแบบที่ Dashboard ใช้
export function transformCaseData(apiCase: ApiCaseData): DashboardCase {
  return {
    id: apiCase.id,
    referenceNo: apiCase.referenceNo,
    title: apiCase.title,
    referralType: apiCase.referralType,
    status: apiCase.status,
    serviceCode: apiCase.serviceCode,
    serviceName: apiCase.serviceReferral?.name || "",
    petName: apiCase.pet?.name || "-",
    petSpecies: apiCase.pet?.species || "",
    petBreed: apiCase.pet?.breed || "",
    petAge: apiCase.pet?.age || "",
    petSex: apiCase.pet?.sex || "",
    petColor: apiCase.pet?.color || "",
    petWeight: apiCase.pet?.weight || "",
    ownerName:
      `${apiCase.pet?.owner?.firstName || ""} ${apiCase.pet?.owner?.lastName || ""}`.trim(),
    ownerPhone: apiCase.pet?.owner?.phone || "",
    ownerAddress: apiCase.pet?.owner?.address || "",
    hospitalName: apiCase.hospital?.name || "",
    vetName:
      `${apiCase.veterinarian?.firstName || ""} ${apiCase.veterinarian?.lastName || ""}`.trim(),
    vetPhone: apiCase.veterinarian?.phone || "",
    createdAt: apiCase.createdAt,
    updatedAt: apiCase.updatedAt,
    appointments: apiCase.appointments?.length || 0,
    medicalFiles: apiCase.medicalFiles?.length || 0,
    caseStatusLogs:
      apiCase.caseStatusLogs?.map((log) => ({
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
        note: log.note,
        createdAt: log.createdAt,
      })) || [],
  };
}
