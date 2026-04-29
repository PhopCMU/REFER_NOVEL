import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dog,
  Eye,
  Filter,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingForm } from "../../component/LoadingForm";
import {
  GetAllOwnersAdmin,
  GetAllPetsAdmin,
  GetVetMember,
} from "../../api/GetApi";
import { getUserFromToken } from "../../utils/authUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberItem {
  id: string;
  vet_codeId: string;
  firstName: string;
  lastName: string;
  ceLicense: string;
  email: string;
  phone: string;
  lineID: string;
  hospitals: Array<{ id: string; name: string }>;
}

interface OwnerItem {
  id: string;
  owner_codeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  hospitalId?: string;
  veterinarianId?: string;
  createdAt?: string;
  updatedAt?: string;
  veterinarian?: {
    firstName?: string;
    lastName?: string;
    vet_codeId?: string;
    email?: string;
  };
}

interface PetItem {
  id: string;
  animal_codeId: string;
  name: string;
  color?: string;
  sex: string;
  weight?: string;
  age: string;
  sterilization?: string;
  species: string;
  exoticdescription?: string;
  breed: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id?: string;
    owner_codeId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    hospitalId?: string;
    veterinarianId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

type ListType = "members" | "owners" | "pets";

interface ListOption {
  value: ListType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIST_OPTIONS: ListOption[] = [
  {
    value: "members",
    label: "ชื่อสมาชิกทั้งหมด",
    icon: <Users className="w-4 h-4" />,
    description: "บัญชีรายชื่อสมาชิกทั้งหมด",
  },
  {
    value: "owners",
    label: "ชื่อเจ้าของสัตว์เลี้ยงทั้งหมด",
    icon: <User className="w-4 h-4" />,
    description: "รายชื่อเจ้าของสัตว์เลี้ยงทั้งหมด",
  },
  {
    value: "pets",
    label: "ชื่อสัตว์เลี้ยงทั้งหมดในระบบ",
    icon: <Dog className="w-4 h-4" />,
    description: "รายชื่อสัตว์เลี้ยงทั้งหมด",
  },
];

const SEX_LABEL: Record<string, string> = {
  M: "ชาย",
  F: "หญิง",
};

const STERILIZATION_LABEL: Record<string, string> = {
  YES: "ทำหมันแล้ว",
  NO: "ยังไม่ทำหมัน",
};

const SPECIES_LABEL: Record<string, string> = {
  Dog: "สุนัข",
  Cat: "แมว",
  Exotic: "สัตว์พิเศษ",
};

const PAGE_SIZE = 10;

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-slate-400"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-base font-medium text-slate-500">ไม่พบข้อมูล</p>
      <p className="text-sm mt-1 text-slate-400">{label}</p>
    </motion.div>
  );
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

interface DropdownProps {
  value: ListType;
  onChange: (v: ListType) => void;
}

function ListTypeDropdown({ value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = LIST_OPTIONS.find((o) => o.value === value)!;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      {/* Label */}
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">
        ประเภทรายชื่อ
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-all duration-150 gap-3"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="text-blue-500">{selected.icon}</span>
          {selected.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.span>
      </button>

      {/* Options */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          >
            {LIST_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors duration-100 hover:bg-blue-50
                      ${active ? "bg-blue-50/70" : ""}`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${active ? "text-blue-500" : "text-slate-400"}`}
                    >
                      {opt.icon}
                    </span>
                    <div>
                      <p
                        className={`text-sm font-medium ${active ? "text-blue-700" : "text-slate-700"}`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                    {active && (
                      <span className="ml-auto mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

function MemberTable({ data }: { data: MemberItem[] }) {
  if (data.length === 0)
    return <EmptyState label="ไม่พบสมาชิกที่ตรงกับคำค้นหา" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ชื่อ
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
              อีเมล
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
              รหัสสมาชิก
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
              โรงพยาบาล
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((m, i) => (
            <motion.tr
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                {i + 1}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.firstName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <span className="font-medium text-slate-800">
                    {m.firstName} {m.lastName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                {m.email}
              </td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">
                {m.vet_codeId}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {m.hospitals.length > 0 ? (
                    m.hospitals.map((h) => (
                      <span
                        key={h.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {h.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerTable({ data }: { data: OwnerItem[] }) {
  if (data.length === 0)
    return <EmptyState label="ไม่พบเจ้าของสัตว์เลี้ยงที่ตรงกับคำค้นหา" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ชื่อ-นามสกุล
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
              เบอร์โทร
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
              อีเมล
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
              ที่อยู่
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
              สัตวแพทย์
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
              รหัสเจ้าของ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((o, i) => (
            <motion.tr
              key={o.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                {i + 1}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {o.firstName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <span className="font-medium text-slate-800">
                    {o.firstName} {o.lastName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                {o.phone || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                {o.email || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                {o.address || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                {o.veterinarian ? (
                  <div>
                    <div className="font-medium text-slate-800">
                      {o.veterinarian.firstName} {o.veterinarian.lastName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {o.veterinarian.vet_codeId || "—"}
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden lg:table-cell">
                {o.owner_codeId}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pet Detail ───────────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-slate-50 rounded-xl p-3 ${className}`}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p
        className={`text-sm font-medium text-slate-800 wrap-break-word ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function PetDetailModal({
  pet,
  onClose,
}: {
  pet: PetItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{pet.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {pet.animal_codeId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pet Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Dog className="w-3.5 h-3.5" />
              ข้อมูลสัตว์เลี้ยง
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DetailField label="รหัสสัตว์" value={pet.animal_codeId} mono />
              <DetailField label="ชื่อสัตว์" value={pet.name} />
              <DetailField
                label="ชนิด"
                value={
                  pet.species === "Exotic" && pet.exoticdescription
                    ? `Exotic (${pet.exoticdescription})`
                    : (SPECIES_LABEL[pet.species] ?? pet.species)
                }
              />
              <DetailField label="สายพันธุ์" value={pet.breed || "—"} />
              <DetailField label="สี" value={pet.color || "—"} />
              <DetailField label="เพศ" value={SEX_LABEL[pet.sex] ?? pet.sex} />
              <DetailField label="อายุ" value={pet.age || "—"} />
              <DetailField
                label="น้ำหนัก"
                value={pet.weight ? `${pet.weight} กก.` : "—"}
              />
              <DetailField
                label="ทำหมัน"
                value={
                  STERILIZATION_LABEL[pet.sterilization ?? ""] ??
                  (pet.sterilization || "—")
                }
              />
              <DetailField
                label="สร้างเมื่อ"
                value={formatDate(pet.createdAt)}
              />
              <DetailField
                label="อัปเดตล่าสุด"
                value={formatDate(pet.updatedAt)}
              />
            </div>
          </div>

          {/* Owner Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              ข้อมูลเจ้าของ
            </h4>
            {pet.owner ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <DetailField
                  label="รหัสเจ้าของ"
                  value={pet.owner.owner_codeId || "—"}
                  mono
                />
                <DetailField
                  label="ชื่อ-นามสกุล"
                  value={`${pet.owner.firstName} ${pet.owner.lastName}`}
                />
                <DetailField label="อีเมล" value={pet.owner.email || "—"} />
                <DetailField label="เบอร์โทร" value={pet.owner.phone || "—"} />
                <DetailField
                  label="ที่อยู่"
                  value={pet.owner.address || "—"}
                  className="col-span-2 sm:col-span-3"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic py-3">
                ไม่มีข้อมูลเจ้าของ
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PetTable({ data }: { data: PetItem[] }) {
  const [selectedPet, setSelectedPet] = useState<PetItem | null>(null);

  if (data.length === 0)
    return <EmptyState label="ไม่พบสัตว์เลี้ยงที่ตรงกับคำค้นหา" />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm min-w-180">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                ชื่อสัตว์
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                ชนิด / สายพันธุ์
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                เพศ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                อายุ / น้ำหนัก
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                ทำหมัน
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                เจ้าของ
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Dog className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        {p.animal_codeId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                      {p.species === "Exotic" && p.exoticdescription
                        ? `Exotic: ${p.exoticdescription}`
                        : (SPECIES_LABEL[p.species] ?? p.species)}
                    </span>
                    {p.breed && (
                      <span className="text-xs text-slate-500">{p.breed}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      p.sex === "M"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-pink-50 text-pink-700 border-pink-200"
                    }`}
                  >
                    {SEX_LABEL[p.sex] ?? p.sex}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs">{p.age || "—"}</span>
                    <span className="text-xs text-slate-400">
                      {p.weight ? `${p.weight} กก.` : ""}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      p.sterilization === "YES"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {STERILIZATION_LABEL[p.sterilization ?? ""] ??
                      (p.sterilization || "—")}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {p.owner ? (
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {p.owner.firstName} {p.owner.lastName}
                      </p>
                      {p.owner.phone && (
                        <p className="text-xs text-slate-400">
                          {p.owner.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedPet(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    aria-label={`ดูรายละเอียด ${p.name}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ดูรายละเอียด</span>
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedPet && (
          <PetDetailModal
            pet={selectedPet}
            onClose={() => setSelectedPet(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-4 border-t border-slate-100 mt-2">
      <p className="text-xs text-slate-500">
        แสดง{" "}
        <span className="font-medium text-slate-700">
          {start}–{end}
        </span>{" "}
        จาก <span className="font-medium text-slate-700">{totalItems}</span>{" "}
        รายการ
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="หน้าก่อนหน้า"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-slate-400 text-sm select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="หน้าถัดไป"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AllInfo() {
  const [listType, setListType] = useState<ListType>("members");
  const [search, setSearch] = useState("");

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [pets, setPets] = useState<PetItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);

  const [petFilterSpecies, setPetFilterSpecies] = useState("");
  const [petFilterSex, setPetFilterSex] = useState("");
  const [petFilterSterilization, setPetFilterSterilization] = useState("");

  const navigate = useNavigate();

  // ── Auth guard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const user = getUserFromToken();
    if (
      !user ||
      user.aud !== "admin" ||
      (user.role !== "ADMIN" && user.role !== "COUNTER")
    ) {
      navigate("/novel/dashboard");
    }
  }, [navigate]);

  // ── Fetch helpers ───────────────────────────────────────────────────────────

  const fetchMembers = async () => {
    if (members.length > 0) return;
    setLoading(true);
    try {
      const resp = await GetVetMember();
      if (resp?.data) {
        setMembers(resp.data);
      } else {
        setErrorMsg("ไม่สามารถโหลดข้อมูลสมาชิกได้");
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    if (owners.length > 0) return;
    setLoading(true);
    try {
      const resp = await GetAllOwnersAdmin();
      if (resp?.data) {
        setOwners(resp.data);
      } else {
        setErrorMsg("ไม่สามารถโหลดข้อมูลเจ้าของสัตว์เลี้ยงได้");
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    if (pets.length > 0) return;
    setLoading(true);
    try {
      const resp = await GetAllPetsAdmin();
      if (resp?.data) {
        setPets(resp.data);
      } else {
        setErrorMsg("ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้");
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ── Load on type change (covers initial mount since listType defaults to "members") ──

  const infoLoadedRef = useRef(false);

  useEffect(() => {
    setSearch("");
    setErrorMsg("");
    setPage(1);
    setPetFilterSpecies("");
    setPetFilterSex("");
    setPetFilterSterilization("");
    if (!infoLoadedRef.current && listType === "members") {
      infoLoadedRef.current = true;
      fetchMembers();
    } else if (listType === "owners") {
      infoLoadedRef.current = true;
      fetchOwners();
    } else if (listType === "pets") {
      infoLoadedRef.current = true;
      fetchPets();
    }
  }, [listType]);

  // ── Filtered data ───────────────────────────────────────────────────────────

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.vet_codeId?.toLowerCase().includes(q) ||
        m.hospitals.some((h) => h.name.toLowerCase().includes(q)),
    );
  }, [members, search]);

  const filteredOwners = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return owners;
    return owners.filter((o) => {
      return (
        o.firstName?.toLowerCase().includes(q) ||
        o.lastName?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.owner_codeId?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        o.hospitalId?.toLowerCase().includes(q) ||
        o.veterinarian?.firstName?.toLowerCase().includes(q) ||
        o.veterinarian?.lastName?.toLowerCase().includes(q) ||
        o.veterinarian?.vet_codeId?.toLowerCase().includes(q) ||
        o.veterinarian?.email?.toLowerCase().includes(q)
      );
    });
  }, [owners, search]);

  const filteredPets = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = pets;
    if (petFilterSpecies)
      result = result.filter((p) => p.species === petFilterSpecies);
    if (petFilterSex) result = result.filter((p) => p.sex === petFilterSex);
    if (petFilterSterilization)
      result = result.filter((p) => p.sterilization === petFilterSterilization);
    if (!q) return result;
    return result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.species?.toLowerCase().includes(q) ||
        p.breed?.toLowerCase().includes(q) ||
        p.animal_codeId?.toLowerCase().includes(q) ||
        p.exoticdescription?.toLowerCase().includes(q) ||
        p.owner?.firstName?.toLowerCase().includes(q) ||
        p.owner?.lastName?.toLowerCase().includes(q) ||
        p.owner?.phone?.toLowerCase().includes(q) ||
        p.owner?.owner_codeId?.toLowerCase().includes(q),
    );
  }, [pets, search, petFilterSpecies, petFilterSex, petFilterSterilization]);

  const currentCount =
    listType === "members"
      ? filteredMembers.length
      : listType === "owners"
        ? filteredOwners.length
        : filteredPets.length;

  const totalCount =
    listType === "members"
      ? members.length
      : listType === "owners"
        ? owners.length
        : pets.length;

  const totalPages = Math.max(1, Math.ceil(currentCount / PAGE_SIZE));

  const pagedMembers = useMemo(
    () => filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMembers, page],
  );
  const pagedOwners = useMemo(
    () => filteredOwners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOwners, page],
  );
  const pagedPets = useMemo(
    () => filteredPets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPets, page],
  );

  const selectedOption = LIST_OPTIONS.find((o) => o.value === listType)!;

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading && totalCount === 0) {
    return <LoadingForm text="กำลังโหลดข้อมูล..." />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full mx-auto">
        {/* ─── Page Header ─────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">รายชื่อทั้งหมด</h1>
          <p className="text-sm text-slate-500 mt-1">
            ดูและค้นหาข้อมูลสมาชิก เจ้าของสัตว์เลี้ยง และสัตว์เลี้ยงในระบบ
          </p>
        </div>

        {/* ─── Controls ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Dropdown */}
            <ListTypeDropdown value={listType} onChange={setListType} />

            {/* Search */}
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={`ค้นหา${selectedOption.label}...`}
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Counter badge */}
            <div className="shrink-0 pb-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                <span className="text-blue-600 font-bold">{currentCount}</span>
                {search ? `/ ${totalCount}` : ""}
                <span>รายการ</span>
              </span>
            </div>
          </div>

          {/* Pet Filters — shown only for pets tab */}
          {listType === "pets" && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0">
                <Filter className="w-3.5 h-3.5" />
                ตัวกรอง:
              </span>
              <select
                value={petFilterSpecies}
                onChange={(e) => {
                  setPetFilterSpecies(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              >
                <option value="">ชนิดทั้งหมด</option>
                <option value="Dog">สุนัข</option>
                <option value="Cat">แมว</option>
                <option value="Exotic">Exotic</option>
              </select>
              <select
                value={petFilterSex}
                onChange={(e) => {
                  setPetFilterSex(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              >
                <option value="">เพศทั้งหมด</option>
                <option value="M">ชาย</option>
                <option value="F">หญิง</option>
              </select>
              <select
                value={petFilterSterilization}
                onChange={(e) => {
                  setPetFilterSterilization(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              >
                <option value="">การทำหมันทั้งหมด</option>
                <option value="YES">ทำหมันแล้ว</option>
                <option value="NO">ยังไม่ทำหมัน</option>
              </select>
              {(petFilterSpecies || petFilterSex || petFilterSterilization) && (
                <button
                  type="button"
                  onClick={() => {
                    setPetFilterSpecies("");
                    setPetFilterSex("");
                    setPetFilterSterilization("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Error Banner ─────────────────────────────────────── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
            >
              <span className="font-medium">ข้อผิดพลาด:</span> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Table ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className="text-blue-500">{selectedOption.icon}</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                {selectedOption.label}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedOption.description}
              </p>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"
                />
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={listType}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {listType === "members" && (
                    <MemberTable data={pagedMembers} />
                  )}
                  {listType === "owners" && <OwnerTable data={pagedOwners} />}
                  {listType === "pets" && <PetTable data={pagedPets} />}
                </motion.div>
              </AnimatePresence>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={currentCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
