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

export default function App() {
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
            <Route path="status" element={<AnimalReferralMonitor />} />
            <Route path="case-referral" element={<CounterPage />} />
            <Route path="hospitals" element={<HospitalData />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
