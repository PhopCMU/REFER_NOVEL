import { ToastContainer } from "react-toastify";

export default function DashboardVet() {
  return (
    <div className="p-10">
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        ยินดีต้อนรับสู่ Dashboard VET (ออกแบบใหม่)
      </h1>
      <p className="text-gray-600">ระบบจัดการการส่งตัวสัตว์ป่วย</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">
            pets
          </span>
          <h3 className="text-lg font-semibold">สัตว์ป่วยทั้งหมด</h3>
          <p className="text-2xl font-bold text-gray-800">24</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <span className="material-symbols-outlined text-4xl text-green-500 mb-2">
            assignment
          </span>
          <h3 className="text-lg font-semibold">รอส่งต่อ</h3>
          <p className="text-2xl font-bold text-gray-800">8</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <span className="material-symbols-outlined text-4xl text-purple-500 mb-2">
            check_circle
          </span>
          <h3 className="text-lg font-semibold">สำเร็จแล้ว</h3>
          <p className="text-2xl font-bold text-gray-800">16</p>
        </div>
      </div>
    </div>
  );
}
