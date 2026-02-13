import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../../../utils/showToast";
import { ToastContainer } from "react-toastify";
import { getUserFromToken } from "../../../utils/authUtils";
import { type FormOwnerProp, type FormPetProp } from "../../../types/type";

interface Pet {
  id?: number;
  name: string;
  type: "Dog" | "Cat" | "Exotic";
  breed: string;
  gender: "male" | "female";
  neutered: boolean;
  ageYears: number;
  ageMonths: number;
  ageDays: number;
  weight: number; // in kg
}

// Mokup data
const ServiceRequested = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // UUID for ServiceRequested entry
    special: {
      name: "Special",
      type: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          code: "DERM",
          name: "คลินิกโรคผิวหนัง",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          code: "OPH",
          name: "คลินิกโรคตา",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          code: "DENT",
          name: "คลินิกช่องปากและทันตกรรม",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          code: "ORTH",
          name: "คลินิกกระดูกและข้อต่อ",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440004",
          code: "CARD",
          name: "คลินิกหัวใจและหลอดเลือด",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440005",
          code: "NEURO",
          name: "คลินิกระบบประสาทและสมอง",
        }, // Fixed duplicate: was "NEU"
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          code: "FEL",
          name: "คลินิกโรคแมว",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440007",
          code: "ONC",
          name: "คลินิกโรคเนื้องอก",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440008",
          code: "PT",
          name: "คลินิกกายภาพบำบัด",
        }, // Fixed duplicate: was "NEU"
        {
          id: "550e8400-e29b-41d4-a716-446655440009",
          code: "ENDO",
          name: "คลินิกฮอร์โมนและต่อมไร้ท่อ",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000a",
          code: "GI",
          name: "คลินิกระบบทางเดินอาหาร",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000b",
          code: "NEPH",
          name: "คลินิกโรคไต",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000c",
          code: "ACU",
          name: "คลินิกฝั่งเข็ม",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000d",
          code: "EXOT",
          name: "คลินิกสัตว์ชนิดพิเศษ",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000e",
          code: "AQUA",
          name: "คลินิกสัตว์น้ำ",
        },
      ],
    },
  },
];

export default function AnimalPage() {
  // === Get user login === //
  const userLogin = getUserFromToken()!;
  // === State === //
  const [owners, setOwners] = useState<FormOwnerProp[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [ownerForm, setOwnerForm] = useState<FormOwnerProp>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  const [petForm, setPetForm] = useState<FormPetProp>({
    name: "",
    color: "",
    sex: "M",
    weight: "",
    age: "",
    sterilization: "UNKNOWN",
    species: "Dog",
    exoticdescription: "",
    breed: "",
  });
  const [editingPetId, setEditingPetId] = useState<string>("");
  const [expandedOwner, setExpandedOwner] = useState<string>("");

  const changeOwnerForm = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = e.target;

      setOwnerForm((prev) => {
        // 1. จัดการกรณี "เบอร์โทรศัพท์" (กรองเฉพาะตัวเลข และไม่เกิน 10 หลัก)
        if (name === "phone") {
          const onlyNums = value.replace(/[^0-9]/g, "");
          if (onlyNums.length <= 10) {
            return { ...prev, [name]: onlyNums };
          }
          return prev; // ถ้าเกิน 10 หลัก ไม่ต้องอัปเดต
        }

        // 2. จัดการฟิลด์ทั่วไป (ชื่อ, นามสกุล, ฯลฯ)
        return {
          ...prev,
          [name]: value,
        };
      });
    },
    [],
  );

  const changePetForm = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = e.target;
      setPetForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [],
  );

  const validateForm = (ownerForm: FormOwnerProp) => {
    if (!ownerForm.firstName?.trim() || !ownerForm.lastName?.trim()) {
      return showToast.error("กรุณากรอกชื่อและนามสกุล");
    }

    // 2. ตรวจสอบเบอร์โทรศัพท์ (ตัวเลข 10 หลัก)
    if (!/^[0-9]{10}$/.test(ownerForm.phone)) {
      return showToast.error("กรุณาตรวจสอบเบอร์โทรศัพท์ให้ครบ 10 หลัก");
    }

    // 3. ตรวจสอบ Email (ใช้ Regex สำหรับ Email มาตรฐาน)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (ownerForm.email && !emailRegex.test(ownerForm.email)) {
      return showToast.error("รูปแบบอีเมลไม่ถูกต้อง");
    }

    // 4. ตรวจสอบที่อยู่ (เช่น ต้องมีความยาวอย่างน้อย 5 ตัวอักษร)
    if (!ownerForm.address?.trim() || ownerForm.address.length < 5) {
      return showToast.error("กรุณากรอกที่อยู่ให้ครบถ้วน");
    }
  };

  // เพิ่มเจ้าของใหม่
  const addOwner = () => {
    if (validateForm(ownerForm)) return;

    try {
    } catch (error) {
      showToast.error("เกิดข้อผิดพลาดในการเพิ่มเจ้าของ");
    }

    const payload: any = {
      ...ownerForm,
      veterinarianId: userLogin?.id,
      hospitalId: userLogin?.hospitalId,
    };

    console.log("payload", payload);
    // const newOwner: Owner = {
    //   id: ownerForm.id || Date.now(),
    //   firstName: ownerForm.firstName,
    //   lastName: ownerForm.lastName,
    //   phone: ownerForm.phone,
    //   email: ownerForm.email,
    //   pets: [],
    // };

    // if (isEditingOwner) {
    //   setOwners(owners.map((o) => (o.id === ownerForm.id ? newOwner : o)));
    //   setIsEditingOwner(false);
    // } else {
    //   setOwners([...owners, newOwner]);
    // }

    // resetOwnerForm();
  };

  const filteredOwners = owners.filter((owner) => {
    const term = searchTerm.toLowerCase();
    return (
      owner.firstName.toLowerCase().includes(term) ||
      owner.lastName.toLowerCase().includes(term) ||
      owner.phone.includes(term) ||
      (owner.email && owner.email.toLowerCase().includes(term))
    );
  });

  // แก้ไขเจ้าของ
  const editOwner = (owner: FormOwnerProp) => {
    // setOwnerForm({
    //   id: owner.id,
    //   firstName: owner.firstName,
    //   lastName: owner.lastName,
    //   phone: owner.phone,
    //   email: owner.email,
    // });
    setIsEditingOwner(true);
  };

  // ลบเจ้าของ
  const removeOwner = (id: number) => {
    // setOwners(owners.filter((o) => o.id !== id));
  };

  // รีเซ็ตฟอร์มเจ้าของ
  const resetOwnerForm = () => {
    // setOwnerForm({
    //   id: 0,
    //   firstName: "",
    //   lastName: "",
    //   phone: "",
    //   email: "",
    // });
    setIsEditingOwner(false);
  };

  // เพิ่มหรืออัปเดตสัตว์
  const addPet = (ownerId: string) => {
    if (!petForm.name || !petForm.breed) {
      return showToast.error("กรุณากรอกชื่อและสายพันธุ์");
    }

    const newPet: FormPetProp = {
      ...petForm,
    };

    // resetPetForm();
    setEditingPetId("");
  };

  // แก้ไขสัตว์
  // const editPet = (ownerId: number, pet: Pet) => {
  //   setPetForm({ ...pet });
  //   setEditingPetId(pet.id);
  //   setExpandedOwner(ownerId); // เปิดรายการ
  // };

  // ลบสัตว์
  // const removePet = (ownerId: number, petId: number) => {
  //   setOwners(
  //     owners.map((o) =>
  //       o.id === ownerId
  //         ? { ...o, pets: o.pets.filter((p) => p.id !== petId) }
  //         : o,
  //     ),
  //   );
  // };

  // รีเซ็ตฟอร์มสัตว์
  const resetPetForm = () => {
    setPetForm({
      id: "",
      name: "",
      color: "",
      sex: "M",
      weight: "",
      age: "",
      sterilization: "UNKNOWN",
      species: "Dog",
      exoticdescription: "",
      breed: "",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              pets
            </span>
            ข้อมูลสัตว์ป่วยและเจ้าของ
          </h1>
          <p className="text-gray-600 mt-1">
            จัดการข้อมูลเจ้าของสัตว์และสัตว์ป่วยในระบบ
          </p>
        </div>
        {/* Search Bar */}
        <div className="flex items-center w-2xl space-x-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
          <span className="material-symbols-outlined text-gray-500">
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหาเจ้าของ (ชื่อ, นามสกุล, เบอร์, อีเมล)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          {owners.length} เจ้าของ
        </div>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไขเจ้าของ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              {isEditingOwner ? "edit" : "person_add"}
            </span>
            {isEditingOwner ? "แก้ไขข้อมูลเจ้าของ" : "เพิ่มข้อมูลเจ้าของ"}
          </h2>

          {/* Important Note Badge */}
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="material-symbols-outlined text-blue-600 text-lg">
              info
            </span>
            <span className="text-sm text-blue-700 font-medium">
              ข้อมูลเจ้าของใช้สำหรับลงนามในระบบ
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="กรอกชื่อจริง"
              name="firstName"
              value={ownerForm.firstName || ""}
              onChange={changeOwnerForm}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="กรอกนามสกุล"
              name="lastName"
              value={ownerForm.lastName}
              onChange={changeOwnerForm}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              placeholder="กรอกเบอร์โทรศัพท์"
              value={ownerForm.phone}
              onChange={changeOwnerForm}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="กรอกอีเมล"
              value={ownerForm.email}
              onChange={changeOwnerForm}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่ <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              placeholder="กรอกที่อยู่ (บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์)"
              value={ownerForm.address}
              onChange={changeOwnerForm}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Medical Certificate Note Section */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-2xl">
                description
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-800">
                  📋 หมายเหตุสำคัญ:
                </span>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  จำเป็นต้องกรอกให้ครบถ้วน
                </span>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    ข้อมูลเจ้าของจะถูกนำไปใช้ในการ{" "}
                    <strong className="text-blue-800">ลงนามในใบนัดหมาย</strong>{" "}
                    ทุกครั้ง
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    กรุณาตรวจสอบความถูกต้องของชื่อ-นามสกุล ให้ตรงกับบัตรประชาชน
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    เบอร์โทรศัพท์และอีเมลใช้สำหรับ{" "}
                    <strong className="text-blue-800">ส่งใบนัดหมาย</strong> และ{" "}
                    <strong className="text-blue-800">
                      แจ้งเตือนการนัดหมาย
                    </strong>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addOwner}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all shadow-sm hover:shadow-blue-200"
          >
            <span className="material-symbols-outlined">save</span>
            {isEditingOwner ? "อัปเดตเจ้าของ" : "เพิ่มเจ้าของ"}
          </motion.button>

          {isEditingOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetOwnerForm}
              className="bg-gray-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-600 transition-all"
            >
              <span className="material-symbols-outlined">cancel</span>
              ยกเลิก
            </motion.button>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-xs text-gray-400 flex items-center gap-1 pt-2 border-t border-gray-100">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>
            ข้อมูลทั้งหมดถูกเก็บเป็นความลับ
            และใช้เฉพาะในการออกเอกสารทางการแพทย์เท่านั้น
          </span>
        </div>
      </motion.div>

      {/* ตารางแสดงข้อมูล */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              list
            </span>
            รายชื่อเจ้าของ
          </h2>
        </div>

        {filteredOwners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl opacity-50 mb-3">
              group_off
            </span>
            <p>ยังไม่มีข้อมูลเจ้าของ</p>
            <p className="text-sm">เริ่มต้นโดยการเพิ่มข้อมูลเจ้าของด้านบน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOwners.map((owner) => (
              <div key={owner.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">
                        person
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {owner.firstName} {owner.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          call
                        </span>
                        {owner.phone || "ไม่มีข้อมูล"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        pets
                      </span>
                      10 ตัว
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      // onClick={() =>
                      //   setExpandedOwner(
                      //     expandedOwner === owner?.id ? "" : owner.id,
                      //   )
                      // }
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {expandedOwner === owner.id
                          ? "expand_less"
                          : "expand_more"}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => editOwner(owner)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      // onClick={() => removeOwner(owner.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </motion.button>
                  </div>
                </div>

                {/* Expand: รายการสัตว์ + ฟอร์ม */}
                <AnimatePresence>
                  {expandedOwner === owner.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 space-y-6"
                    >
                      {/* ฟอร์มเพิ่ม/แก้ไขสัตว์ */}
                      <div className="bg-gray-50 p-5 rounded-lg space-y-4 border">
                        <h4 className="font-medium text-gray-800 flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600">
                            {editingPetId ? "edit" : "add_circle"}
                          </span>
                          {editingPetId
                            ? "แก้ไขข้อมูลสัตว์ป่วย"
                            : "เพิ่มสัตว์ป่วย"}
                        </h4>
                        <div className="grid md:grid-cols-6 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ชื่อสัตว์
                            </label>
                            <input
                              type="text"
                              name="name"
                              placeholder="ชื่อสัตว์"
                              value={petForm.name}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ชนิด
                            </label>
                            <select
                              name="species"
                              value={petForm.species}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              {[
                                {
                                  value: "Dog",
                                  label: "สุนข",
                                },
                                {
                                  value: "Cat",
                                  label: "แมว",
                                },
                                {
                                  value: "Exotic",
                                  label: "สัตว์ชนิดพิเศษ",
                                },
                              ].map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {petForm.species === "Exotic" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ชนิดพิเศษ (เช่น เต๋า, นก, งู, ม้าน้ำ)
                              </label>
                              <input
                                type="text"
                                name="exoticdescription"
                                placeholder="ประเภทสัตว์ชนิดพิเศษ"
                                value={petForm.exoticdescription}
                                onChange={changePetForm}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              สายพันธุ์
                            </label>
                            <input
                              type="text"
                              name="breed"
                              placeholder="เช่น พุดเดิ้ล"
                              value={petForm.breed}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เพศ
                            </label>
                            <select
                              name="sex"
                              value={petForm.sex}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              {[
                                {
                                  value: "M",
                                  label: "ชาย",
                                },
                                {
                                  value: "F",
                                  label: "หญิง",
                                },
                              ].map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ทำหมัน
                            </label>
                            <select
                              name="sterilization"
                              value={petForm.sterilization}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              {[
                                {
                                  value: "YES",
                                  label: "ทําหมันแล้ว",
                                },
                                {
                                  value: "NO",
                                  label: "ยังไม่ทําหมัน",
                                },
                                {
                                  value: "UNKNOWN",
                                  label: "ไม่ทราบ",
                                },
                              ].map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-6 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              อายุ
                            </label>
                            <input
                              type="text"
                              name="age"
                              value={petForm.age}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              น้ำหนัก (กก.)
                            </label>
                            <input
                              type="text"
                              placeholder="เช่น 5.5"
                              value={petForm.weight || ""}
                              onChange={changePetForm}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addPet(owner.id || "")}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-1 hover:shadow-md transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {editingPetId ? "save" : "add"}
                            </span>
                            {editingPetId ? "อัปเดตสัตว์" : "เพิ่มสัตว์"}
                          </motion.button>
                          {editingPetId && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                resetPetForm();
                                setEditingPetId("");
                              }}
                              className="bg-gray-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-1 hover:bg-gray-600 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">
                                cancel
                              </span>
                              ยกเลิก
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* ตารางสัตว์ */}

                      {/* {owner.pets.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-3 text-left text-sm font-medium text-gray-700">
                                  ชื่อ
                                </th>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">
                                  ชนิด
                                </th>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">
                                  อายุ
                                </th>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">
                                  น้ำหนัก
                                </th>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">
                                  จัดการ
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {owner.pets.map((pet) => (
                                <tr
                                  key={pet.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="p-3 text-gray-800">
                                    {pet.name}
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    {pet.type === "Dog"
                                      ? "สุนัข"
                                      : pet.type === "Cat"
                                        ? "แมว"
                                        : "สัตว์แปลก"}
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    {pet.ageYears > 0 && `${pet.ageYears} ปี `}
                                    {pet.ageMonths > 0 &&
                                      `${pet.ageMonths} เดือน `}
                                    {pet.ageDays > 0 && `${pet.ageDays} วัน`}
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    {pet.weight} กก.
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        // onClick={() => editPet(owner.id, pet)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          edit
                                        </span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        // onClick={() =>
                                        //   removePet(owner.id, pet.id)
                                        // }
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          delete
                                        </span>
                                      </motion.button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <span className="material-symbols-outlined text-3xl opacity-50 mb-2">
                            pets
                          </span>
                          <p>ยังไม่มีสัตว์ป่วย</p>
                        </div>
                      )} */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
