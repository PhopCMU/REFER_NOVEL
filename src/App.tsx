import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Layout from "./component/layout/Layout";
import SignIn from "./pages/SignIn";
import PrivateRoute from "./component/PrivateRoute";
import Dashboard from "./pages/Dashboard/page";
import VetsPage from "./pages/Dashboard/vets/vet";
import ReferralsPage from "./pages/Dashboard/vets/referrals";
import FormRepassword from "./pages/Forms/FormRepassword";
import AnimalReferralMonitor from "./pages/Dashboard/vets/animalreferralmonitor";

import CounterPage from "./pages/Dashboard/counters/counter";
import HospitalData from "./pages/DataHospitals/hospital_data";
import PermissionData from "./pages/Permissions/permission_data";
import Workplaces from "./pages/Dashboard/vets/workplaces";
import { useUpdateVersion } from "./hook/useUpdateVersion";
import DataUser from "./pages/Dashboard/vets/datauser";
import FeedbackReport from "./pages/Feedback/feedback_report";

export default function App() {
  const { needsUpdate, currentVersion, doUpdate } = useUpdateVersion();

  if (needsUpdate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center border border-indigo-100">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-5">
            <span className="material-symbols-outlined text-4xl text-indigo-600">
              system_update
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            มีการอัปเดตระบบใหม่
          </h2>
          <p className="text-gray-500 text-sm mb-1">
            เวอร์ชันใหม่{" "}
            <span className="font-semibold text-indigo-600">
              v{currentVersion}
            </span>{" "}
            พร้อมใช้งานแล้ว
          </p>
          <p className="text-gray-400 text-xs mb-6">
            กรุณาอัปเดตเพื่อรับการเปลี่ยนแปลงล่าสุดก่อนดำเนินการต่อ
          </p>

          {/* Update Button */}
          <button
            onClick={doUpdate}
            className="w-full py-3 px-6 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            อัปเดตและโหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/novel/dashboard" replace />} />

        {/* public */}
        <Route path="/sign-in" element={<SignIn />} />

        <Route path="/forgot-password" element={<FormRepassword />} />

        {/* protected */}
        <Route element={<PrivateRoute children={<Outlet />} />}>
          <Route path="/novel" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="animals" element={<VetsPage />} />
            <Route path="referral" element={<ReferralsPage />} />
            <Route path="workplaces" element={<Workplaces />} />
            <Route path="status" element={<AnimalReferralMonitor />} />
            <Route path="case-referral" element={<CounterPage />} />
            <Route path="hospitals" element={<HospitalData />} />
            <Route path="permission" element={<PermissionData />} />
            <Route path="profile" element={<DataUser />} />
            <Route path="feedback-report" element={<FeedbackReport />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
