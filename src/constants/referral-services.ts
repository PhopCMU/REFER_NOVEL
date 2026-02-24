import type { ServiceReferral } from "../types/type";

export const REFERRAL_SERVICES: ServiceReferral[] = [
  {
    id: "299bc437-8866-42cd-b907-339d0b30d80e",
    code: "OPH",
    nameTH: "คลินิกโรคตา",
    nameEN: "Ophthalmology Clinic",
    isActive: true,
  },
  {
    id: "43620f75-b0cc-456f-aa25-a50d3259d07e",
    code: "DENT",
    nameTH: "คลินิกช่องปากและทันตกรรม",
    nameEN: "Dental Clinic",
    isActive: true,
  },
  {
    id: "88a76856-fdea-463d-99ba-4fb93d70735c",
    code: "ORTH",
    nameTH: "คลินิกกระดูกและข้อต่อ",
    nameEN: "Orthopedic Clinic",
    isActive: true,
  },
  {
    id: "30718b99-1a9a-4f8a-aa20-9b9595bfd293",
    code: "CARD",
    nameTH: "คลินิกหัวใจและหลอดเลือด",
    nameEN: "Cardiology Clinic",
    isActive: true,
  },
  {
    id: "8fe0c7bb-b06b-48eb-9872-0c0f0f8beb37",
    code: "NEURO",
    nameTH: "คลินิกระบบประสาทและสมอง",
    nameEN: "Neurology Clinic",
    isActive: true,
  },
  {
    id: "a10a07b2-57d6-4856-a9b4-c3f7eaf5d2d3",
    code: "FEL",
    nameTH: "คลินิกโรคแมว",
    nameEN: "Feline Clinic",
    isActive: true,
  },
  {
    id: "e8085951-e12b-4fb2-a132-29e98dcaed88",
    code: "ONC",
    nameTH: "คลินิกโรคเนื้องอก",
    nameEN: "Oncology Clinic",
    isActive: true,
  },
  {
    id: "8e9196aa-bf37-4384-b5aa-c21538671314",
    code: "PT",
    nameTH: "คลินิกกายภาพบำบัด",
    nameEN: "Physical Therapy Clinic",
    isActive: true,
  },
  {
    id: "5eef934c-21df-4e2d-a6e0-8c38bb1d816e",
    code: "ENDO",
    nameTH: "คลินิกฮอร์โมนและต่อมไร้ท่อ",
    nameEN: "Endocrinology Clinic",
    isActive: true,
  },
  {
    id: "3b233e6f-3751-4018-9b4b-1a9e8fc60e8e",
    code: "GI",
    nameTH: "คลินิกระบบทางเดินอาหาร",
    nameEN: "Gastroenterology Clinic",
    isActive: true,
  },
  {
    id: "6987cc08-1446-4945-a62a-395201fc2819",
    code: "NEPH",
    nameTH: "คลินิกโรคไต",
    nameEN: "Nephrology Clinic",
    isActive: true,
  },
  {
    id: "79e81546-009a-4d18-a564-a94fd921e7c9",
    code: "ACU",
    nameTH: "คลินิกฝังเข็ม",
    nameEN: "Acupuncture Clinic",
    isActive: true,
  },
  {
    id: "7da4c26c-c68b-4b5c-af9f-b3585b8835f0",
    code: "EXOT",
    nameTH: "คลินิกสัตว์ชนิดพิเศษ",
    nameEN: "Exotic Animal Clinic",
    isActive: true,
  },
  {
    id: "c0a9997f-be17-4637-b256-6843469783d1",
    code: "AQUA",
    nameTH: "คลินิกสัตว์น้ำ",
    nameEN: "Aquatic Animal Clinic",
    isActive: true,
  },
];

// ✅ Helper: หา service จาก id
export function getServiceById(id: string): ServiceReferral | undefined {
  return REFERRAL_SERVICES.find((s) => s.id === id);
}

// ✅ Helper: หา service จาก code
export function getServiceByCode(code: string): ServiceReferral | undefined {
  return REFERRAL_SERVICES.find((s) => s.code === code);
}

// ✅ Helper: กรอง service ที่ active
export function getActiveServices(): ServiceReferral[] {
  return REFERRAL_SERVICES.filter((s) => s.isActive);
}
