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
import VetsPage from "./pages/Dashboard/vets/page";
import ReferralsPage from "./pages/Dashboard/vets/referrals";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/novel/dashboard" replace />} />

        {/* public */}

        <Route path="/sign-in" element={<SignIn />} />

        {/* protected */}
        <Route element={<PrivateRoute children={<Outlet />} />}>
          <Route path="/novel" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="animals" element={<VetsPage />} />
            <Route path="referral" element={<ReferralsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
