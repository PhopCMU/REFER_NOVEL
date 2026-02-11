import { useState } from "react";
import InfoModal from "./InfoModal";

const Footer = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <footer className="bg-white border-t border-gray-100 px-6 py-5 mt-auto">
      {/* Main Footer Content */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2 mb-3 md:mb-0">
          <span className="material-symbols-outlined text-blue-600 text-lg">
            local_hospital
          </span>
          <p className="text-sm font-medium text-gray-700">
            &copy; {new Date().getFullYear()} NOVEL & VET CMU Referral System
            LLC. All rights reserved.
          </p>
          <a
            href="#"
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            aria-label="Facebook"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>

        <div className="flex items-center space-x-5">
          <button
            type="button"
            onClick={() => setActiveModal("privacy")}
            className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            นโยบายความเป็นส่วนตัว
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("terms")}
            className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            เงื่อนไขการใช้งาน
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("help")}
            className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            การช่วยเหลือ
          </button>
        </div>
      </div>

      {/* Version */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Version 2.1.0 • Last updated: {new Date().toLocaleDateString("th-TH")}
        </p>
      </div>

      {/* Modals */}
      {/* Privacy Policy */}
      <InfoModal
        isOpen={activeModal === "privacy"}
        onClose={closeModal}
        title="นโยบายความเป็นส่วนตัว"
        icon="privacy_tip"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-blue-500 mr-3 mt-0.5">
              security
            </span>
            <p className="text-gray-700">
              เรารักษ์ข้อมูลส่วนบุคคลของท่านอย่างสูงสุด
              ข้อมูลที่ท่านให้กับระบบจะถูกใช้เฉพาะเพื่อการส่งตัวสัตว์ป่วย
              และการติดต่อระหว่างโรงพยาบาลเท่านั้น
            </p>
          </div>

          <div className="flex items-start">
            <span className="material-symbols-outlined text-blue-500 mr-3 mt-0.5">
              visibility_off
            </span>
            <p className="text-gray-700">
              เราไม่เปิดเผยข้อมูลให้กับบุคคลที่สามโดยไม่ได้รับความยินยอม
              เว้นแต่ตามกฎหมายหรือหน่วยงานราชการร้องขอ
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
            <h4 className="font-semibold text-blue-800 flex items-center">
              <span className="material-symbols-outlined text-blue-600 mr-2">
                database
              </span>
              ข้อมูลที่เราเก็บรวบรวม
            </h4>
            <ul className="list-none space-y-2 mt-3">
              <li className="flex items-center">
                <span className="material-symbols-outlined text-blue-500 text-sm mr-2">
                  check_circle
                </span>
                <span>ชื่อ นามสกุล สังกัดหน่วยงาน</span>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-blue-500 text-sm mr-2">
                  check_circle
                </span>
                <span>อีเมลและเบอร์ติดต่อ</span>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-blue-500 text-sm mr-2">
                  check_circle
                </span>
                <span>ข้อมูลการใช้งานระบบ</span>
              </li>
            </ul>
          </div>
        </div>
      </InfoModal>

      {/* Terms of Service */}
      <InfoModal
        isOpen={activeModal === "terms"}
        onClose={closeModal}
        title="เงื่อนไขการใช้งาน"
        icon="policy"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-purple-500 mr-3 mt-0.5">
              verified_user
            </span>
            <p className="text-gray-700">
              การใช้งานระบบส่งตัวสัตว์ป่วยต้องเป็นผู้ลงทะเบียนและได้รับอนุญาตจากทางคณะสัตวแพทยศาสตร์
              มหาวิทยาลัยเชียงใหม่
            </p>
          </div>

          <div className="flex items-start">
            <span className="material-symbols-outlined text-purple-500 mr-3 mt-0.5">
              block
            </span>
            <p className="text-gray-700">
              ผู้ใช้ต้องไม่กระทำการใด ๆ ที่ละเมิดกฎหมาย หรือทำให้ระบบขัดข้อง
              เช่น การแฮก การใช้สคริปต์โจมตี
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-4">
            <h4 className="font-semibold text-purple-800 flex items-center">
              <span className="material-symbols-outlined text-purple-600 mr-2">
                warning
              </span>
              ข้อจำกัดความรับผิดชอบ
            </h4>
            <p className="text-gray-700 mt-2">
              ทีมพัฒนาไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานผิดวัตถุประสงค์
              หรือการล่าช้าในการส่งตัว ซึ่งเกิดจากปัจจัยภายนอก เช่น
              สัญญาณอินเทอร์เน็ต หรือการยืนยันล่าช้าจากโรงพยาบาลปลายทาง
            </p>
          </div>
        </div>
      </InfoModal>

      {/* Help & Support */}
      <InfoModal
        isOpen={activeModal === "help"}
        onClose={closeModal}
        title="การช่วยเหลือ"
        icon="support_agent"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-green-500 mr-3 mt-0.5">
              help
            </span>
            <p className="text-gray-700">
              หากท่านมีปัญหาในการใช้งานระบบ หรือต้องการความช่วยเหลือ
              กรุณาติดต่อทีมสนับสนุนได้ที่:
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="material-symbols-outlined text-green-600 mr-3">
                  mail
                </span>
                <div>
                  <strong className="text-gray-800">อีเมล:</strong>
                  <p className="text-gray-700">support@novelvetcmu.ac.th</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-green-600 mr-3">
                  call
                </span>
                <div>
                  <strong className="text-gray-800">โทร:</strong>
                  <p className="text-gray-700">053-946-100 ต่อ 1234</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-green-600 mr-3">
                  schedule
                </span>
                <div>
                  <strong className="text-gray-800">เวลางาน:</strong>
                  <p className="text-gray-700">
                    จันทร์ - ศุกร์ 08:30 - 16:30 น.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex items-start mt-4">
            <span className="material-symbols-outlined text-green-500 mr-3 mt-0.5">
              menu_book
            </span>
            <p className="text-gray-700">
              หรือเยี่ยมชม{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                ศูนย์ช่วยเหลือออนไลน์
              </a>{" "}
              เพื่อดูคู่มือการใช้งานแบบละเอียด
            </p>
          </div>
        </div>
      </InfoModal>
    </footer>
  );
};

export default Footer;
