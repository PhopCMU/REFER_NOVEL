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
