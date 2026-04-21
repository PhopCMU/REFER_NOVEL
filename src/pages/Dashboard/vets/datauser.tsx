import { useState, useMemo } from "react";
import { useUserProfile } from "../../../hook/useUserProfile";
import type { PayloadUpdateVetProfile } from "../../../types/type";
import { showToast } from "../../../utils/showToast";

// ─── Editable fields only ────────────────────────────────────────────────────
type EditableField = keyof PayloadUpdateVetProfile;

const FIELDS: Array<{
  key: EditableField;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}> = [
  {
    key: "firstName",
    label: "ชื่อ",
    type: "text",
    placeholder: "ชื่อ",
    required: true,
  },
  {
    key: "lastName",
    label: "นามสกุล",
    type: "text",
    placeholder: "นามสกุล",
    required: true,
  },
  {
    key: "phone",
    label: "เบอร์โทรศัพท์",
    type: "tel",
    placeholder: "0xx-xxx-xxxx",
    required: true,
  },
  {
    key: "lineID",
    label: "Line ID",
    type: "text",
    placeholder: "@line-id",
    required: true,
  },
  {
    key: "ceLicense",
    label: "ใบประกอบวิชาชีพ CE",
    type: "text",
    placeholder: "xx-xxxxx/xxxx",
    required: true,
  },
];

// ─── Helper: check for blank fields ─────────────────────────────────────────
function validate(
  form: PayloadUpdateVetProfile,
): Partial<Record<EditableField, string>> {
  const errs: Partial<Record<EditableField, string>> = {};
  FIELDS.forEach(({ key, label, required }) => {
    if (required && !form[key].trim()) errs[key] = `กรุณากรอก${label}`;
  });
  return errs;
}

// ─── Read-only info row ───────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className="text-base font-medium text-slate-800">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function DataUser() {
  const { profile, loading, saving, error, refetch, updateProfile } =
    useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PayloadUpdateVetProfile>({
    firstName: "",
    lastName: "",
    phone: "",
    lineID: "",
    ceLicense: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<EditableField, string>>
  >({});

  // Open edit mode — seed form from current profile
  const handleEdit = async () => {
    if (!profile) return;

    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      lineID: profile.lineID,
      ceLicense: profile.ceLicense,
    });

    setFieldErrors({});
    setIsEditing(true);
  };

  // Cancel — discard changes
  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
  };

  // Dirty check — disable Save when nothing changed
  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.firstName !== profile.firstName ||
      form.lastName !== profile.lastName ||
      form.phone !== profile.phone ||
      form.lineID !== profile.lineID ||
      form.ceLicense !== profile.ceLicense
    );
  }, [form, profile]);

  const handleChange = (key: EditableField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    try {
      const paylaod: PayloadUpdateVetProfile = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        lineID: form.lineID,
        ceLicense: form.ceLicense,
      };

      const resp = await updateProfile(paylaod);
      if (typeof resp === "string") {
        showToast.error(resp);
        return;
      }

      if (resp) {
        showToast.success("บันทึกข้อมูลสำเร็จ");
      } else {
        showToast.error("บันทึกข้อมูลไม่สำเร็จ");
      }

      setIsEditing(false);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ",
      );
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh]"
        role="status"
        aria-label="กำลังโหลด"
      >
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl bg-red-50 border border-red-200">
        <p className="text-red-700 font-medium mb-4">
          {error ?? "ไม่พบข้อมูลผู้ใช้งาน"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // ── Main card ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Two-column layout: profile card left, guidelines card right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── LEFT: profile card (spans 2 of 3 columns) ───────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-100 overflow-hidden">
            {/* ── Banner / Avatar area ───────────────────────────────────────── */}
            <div className="relative h-32 bg-linear-to-r from-indigo-500 via-blue-500 to-cyan-500">
              <div className="absolute -bottom-10 left-8 flex items-end gap-4">
                <div
                  aria-hidden="true"
                  className="w-20 h-20 rounded-2xl bg-white ring-4 ring-white shadow-lg flex items-center justify-center"
                >
                  <span className="text-3xl font-bold text-indigo-600 select-none">
                    {profile.firstName.charAt(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Name + edit button ─────────────────────────────────────────── */}
            <div className="pt-14 px-8 pb-6 flex items-start justify-between gap-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
              </div>

              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="shrink-0 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  แก้ไขข้อมูล
                </button>
              )}
            </div>

            <div className="px-8 py-6 space-y-8">
              {/* ── Read-only identity section ──────────────────────────────── */}
              <section aria-labelledby="identity-heading">
                <h2
                  id="identity-heading"
                  className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
                >
                  ข้อมูลประจำตัว
                </h2>
                <div className="rounded-2xl bg-slate-50 px-5 divide-y divide-slate-100">
                  <InfoRow label="รหัสสัตวแพทย์" value={profile.vet_codeId} />
                  <InfoRow label="อีเมล" value={profile.email} />
                </div>
              </section>

              {/* ── Editable / display section ───────────────────────────────── */}
              <section aria-labelledby="contact-heading">
                <h2
                  id="contact-heading"
                  className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
                >
                  ข้อมูลติดต่อและใบประกอบวิชาชีพ
                </h2>

                {isEditing ? (
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                    className="rounded-2xl bg-slate-50 px-5 py-4 space-y-4"
                  >
                    {FIELDS.map(({ key, label, type, placeholder }) => (
                      <div key={key}>
                        <label
                          htmlFor={`field-${key}`}
                          className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1"
                        >
                          {label}{" "}
                          <span className="text-red-500" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <input
                          id={`field-${key}`}
                          type={type}
                          value={form[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                          placeholder={placeholder}
                          aria-invalid={!!fieldErrors[key]}
                          aria-describedby={
                            fieldErrors[key] ? `err-${key}` : undefined
                          }
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors bg-white
                        ${
                          fieldErrors[key]
                            ? "border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-500"
                            : "border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                        }
                        focus:outline-none`}
                        />
                        {fieldErrors[key] && (
                          <p
                            id={`err-${key}`}
                            role="alert"
                            className="mt-1 text-xs text-red-600"
                          >
                            {fieldErrors[key]}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* ── Action row ─────────────────────────────────────────── */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={!isDirty || saving}
                        aria-disabled={!isDirty || saving}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                      hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                      transition-colors focus-visible:outline 
                      focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {saving ? (
                          <span className="flex items-center justify-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                              aria-hidden="true"
                            />
                            กำลังบันทึก…
                          </span>
                        ) : (
                          "บันทึก"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold
                      hover:bg-slate-300 disabled:opacity-40 transition-colors
                      focus-visible:outline  focus-visible:outline-offset-2
                      focus-visible:outline-slate-400"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-5 divide-y divide-slate-100">
                    <InfoRow
                      label="ชื่อ-นามสกุล"
                      value={`${profile.firstName} ${profile.lastName}`}
                    />
                    <InfoRow label="เบอร์โทรศัพท์" value={profile.phone} />
                    <InfoRow label="Line ID" value={profile.lineID} />
                    <InfoRow
                      label="ใบประกอบวิชาชีพ CE"
                      value={profile.ceLicense}
                    />
                  </div>
                )}
              </section>

              {/* ── Hospitals section ──────────────────────────────────────────── */}
              <section aria-labelledby="hospitals-heading">
                <h2
                  id="hospitals-heading"
                  className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
                >
                  สถานที่ทำงาน
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {profile.hospitals.length > 0 ? (
                    profile.hospitals.map((h) => (
                      <li
                        key={h.id}
                        className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium ring-1 ring-indigo-200"
                      >
                        {h.name}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-400">ไม่มีข้อมูล</li>
                  )}
                </ul>
              </section>
            </div>
            {/* end px-8 py-6 content */}
          </div>
          {/* end rounded-3xl card */}
        </div>
        {/* end lg:col-span-2 */}

        {/* ── RIGHT: guidelines card (spans 1 of 3 columns) ───────────── */}
        <aside
          aria-labelledby="guidelines-heading"
          className="rounded-3xl bg-amber-50 ring-1 ring-amber-200 overflow-hidden shadow-md"
        >
          {/* Card header */}
          <div className="flex items-center gap-3 bg-amber-100 px-5 py-4 border-b border-amber-200">
            <span
              aria-hidden="true"
              className="shrink-0 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="white"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <h2
              id="guidelines-heading"
              className="text-sm font-bold text-amber-900"
            >
              ข้อควรทราบก่อนแก้ไขข้อมูล
            </h2>
          </div>

          {/* Card body */}
          <div className="px-5 py-5 space-y-4 text-sm leading-relaxed text-amber-900">
            <p>
              ก่อนที่คุณจะดำเนินการแก้ไขข้อมูล
              โปรดอ่านรายละเอียดสำคัญดังต่อไปนี้:
            </p>

            {/* Rule 1 */}
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center"
              >
                1
              </span>
              <p>
                การแก้ไขข้อมูลส่วนบุคคลในระบบนี้ อนุญาตให้ดำเนินการได้โดย{" "}
                <strong className="font-semibold">"เจ้าของข้อมูล"</strong>{" "}
                เท่านั้น เพื่อความปลอดภัยและความถูกต้องของข้อมูล
                ผู้ใช้งานจะต้องเป็นผู้ดำเนินการแก้ไขด้วยตนเองผ่านระบบ
                ไม่สามารถมอบหมายหรือให้ผู้อื่นดำเนินการแทนได้
              </p>
            </div>

            {/* Divider + warning */}
            <div className="rounded-xl bg-amber-200/60 border border-amber-300 px-4 py-3 flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="shrink-0 w-4 h-4 mt-0.5 text-amber-700"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 1zM5.05 6.05a.75.75 0 011.06 0L10 9.94l3.89-3.89a.75.75 0 111.06 1.06l-4.42 4.42a.75.75 0 01-1.06 0L5.05 7.11a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-amber-800">
                กรุณาตรวจสอบความถูกต้องของข้อมูลทุกครั้งก่อนทำการบันทึก
                เพื่อป้องกันปัญหาในการเข้าสู่ระบบและการใช้งานในภายหลัง
              </p>
            </div>
          </div>
        </aside>
      </div>
      {/* end grid */}
    </div>
  );
}
