import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../../../utils/showToast";
import { ToastContainer } from "react-toastify";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pets: Pet[];
}

interface Pet {
  id: number;
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

export default function AnimalPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [ownerForm, setOwnerForm] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  const [petForm, setPetForm] = useState<Pet>({
    id: 0,
    name: "",
    type: "Dog",
    breed: "",
    gender: "male",
    neutered: false,
    ageYears: 0,
    ageMonths: 0,
    ageDays: 0,
    weight: 0,
  });
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<number | null>(null);

  // เพิ่มเจ้าของใหม่
  const addOwner = () => {
    if (!ownerForm.firstName || !ownerForm.lastName) {
      return showToast.error("กรุณากรอกชื่อและนามสกุล");
    }
    if (!/^[0-9]{10}$/.test(ownerForm.phone)) {
      return showToast.error("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก");
    }

    const newOwner: Owner = {
      id: ownerForm.id || Date.now(),
      firstName: ownerForm.firstName,
      lastName: ownerForm.lastName,
      phone: ownerForm.phone,
      email: ownerForm.email,
      pets: [],
    };

    if (isEditingOwner) {
      setOwners(owners.map((o) => (o.id === ownerForm.id ? newOwner : o)));
      setIsEditingOwner(false);
    } else {
      setOwners([...owners, newOwner]);
    }

    resetOwnerForm();
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
  const editOwner = (owner: Owner) => {
    setOwnerForm({
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      phone: owner.phone,
      email: owner.email,
    });
    setIsEditingOwner(true);
  };

  // ลบเจ้าของ
  const removeOwner = (id: number) => {
    setOwners(owners.filter((o) => o.id !== id));
  };

  // รีเซ็ตฟอร์มเจ้าของ
  const resetOwnerForm = () => {
    setOwnerForm({
      id: 0,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    });
    setIsEditingOwner(false);
  };

  // เพิ่มหรืออัปเดตสัตว์
  const addPet = (ownerId: number) => {
    if (!petForm.name || !petForm.breed) {
      return showToast.error("กรุณากรอกชื่อและสายพันธุ์");
    }
    if (petForm.ageYears > 99) {
      return showToast.error("อายุไม่ควรเกิน 99 ปี");
    }

    const newPet: Pet = {
      ...petForm,
      id: editingPetId || Date.now(),
    };

    setOwners(
      owners.map((o) =>
        o.id === ownerId
          ? {
              ...o,
              pets: editingPetId
                ? o.pets.map((p) => (p.id === editingPetId ? newPet : p))
                : [...o.pets, newPet],
            }
          : o
      )
    );

    resetPetForm();
    setEditingPetId(null);
  };

  // แก้ไขสัตว์
  const editPet = (ownerId: number, pet: Pet) => {
    setPetForm({ ...pet });
    setEditingPetId(pet.id);
    setExpandedOwner(ownerId); // เปิดรายการ
  };

  // ลบสัตว์
  const removePet = (ownerId: number, petId: number) => {
    setOwners(
      owners.map((o) =>
        o.id === ownerId
          ? { ...o, pets: o.pets.filter((p) => p.id !== petId) }
          : o
      )
    );
  };

  // รีเซ็ตฟอร์มสัตว์
  const resetPetForm = () => {
    setPetForm({
      id: 0,
      name: "",
      type: "Dog",
      breed: "",
      gender: "male",
      neutered: false,
      ageYears: 0,
      ageMonths: 0,
      ageDays: 0,
      weight: 0,
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
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">
            {isEditingOwner ? "edit" : "person_add"}
          </span>
          {isEditingOwner ? "แก้ไขข้อมูลเจ้าของ" : "เพิ่มข้อมูลเจ้าของ"}
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ
            </label>
            <input
              placeholder="กรอกชื่อจริง"
              value={ownerForm.firstName}
              onChange={(e) =>
                setOwnerForm({ ...ownerForm, firstName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              นามสกุล
            </label>
            <input
              placeholder="กรอกนามสกุล"
              value={ownerForm.lastName}
              onChange={(e) =>
                setOwnerForm({ ...ownerForm, lastName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              placeholder="กรอกเบอร์โทรศัพท์"
              value={ownerForm.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val.length <= 10) {
                  setOwnerForm({ ...ownerForm, phone: val });
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              placeholder="กรอกอีเมล"
              value={ownerForm.email}
              onChange={(e) =>
                setOwnerForm({ ...ownerForm, email: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addOwner}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
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
                      {owner.pets.length} ตัว
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setExpandedOwner(
                          expandedOwner === owner.id ? null : owner.id
                        )
                      }
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
                      onClick={() => removeOwner(owner.id)}
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
                              placeholder="ชื่อสัตว์"
                              value={petForm.name}
                              onChange={(e) =>
                                setPetForm({ ...petForm, name: e.target.value })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ชนิด
                            </label>
                            <select
                              value={petForm.type}
                              onChange={(e) =>
                                setPetForm({
                                  ...petForm,
                                  type: e.target.value as any,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              <option value="Dog">สุนัข</option>
                              <option value="Cat">แมว</option>
                              <option value="Exotic">สัตว์แปลก</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              สายพันธุ์
                            </label>
                            <input
                              placeholder="เช่น พุดเดิ้ล"
                              value={petForm.breed}
                              onChange={(e) =>
                                setPetForm({
                                  ...petForm,
                                  breed: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เพศ
                            </label>
                            <select
                              value={petForm.gender}
                              onChange={(e) =>
                                setPetForm({
                                  ...petForm,
                                  gender: e.target.value as any,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              <option value="male">ชาย</option>
                              <option value="female">หญิง</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ทำหมัน
                            </label>
                            <select
                              value={petForm.neutered ? "true" : "false"}
                              onChange={(e) =>
                                setPetForm({
                                  ...petForm,
                                  neutered: e.target.value === "true",
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            >
                              <option value="false">ไม่ใช่</option>
                              <option value="true">ใช่</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-6 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              อายุ (ปี)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={petForm.ageYears}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 99) {
                                  setPetForm({ ...petForm, ageYears: val });
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เดือน
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="11"
                              value={petForm.ageMonths}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 11) {
                                  setPetForm({ ...petForm, ageMonths: val });
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              วัน
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={petForm.ageDays}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 30) {
                                  setPetForm({ ...petForm, ageDays: val });
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              น้ำหนัก (กก.)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="เช่น 5.5"
                              value={petForm.weight || ""}
                              onChange={(e) =>
                                setPetForm({
                                  ...petForm,
                                  weight: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addPet(owner.id)}
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
                                setEditingPetId(null);
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
                      {owner.pets.length > 0 ? (
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
                                        onClick={() => editPet(owner.id, pet)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          edit
                                        </span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() =>
                                          removePet(owner.id, pet.id)
                                        }
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
                      )}
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
