// src/main.tsx
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "material-symbols";
import "react-toastify/dist/ReactToastify.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import SignIn from "./pages/SignIn.tsx";

import Dashboard from "./pages/Dashboard/page.tsx";
import AnimalPage from "./pages/Dashboard/Animals/page.tsx";
// import AnimalList from "./pages/animals/AnimalList.tsx";
// import ReferralForm from "./pages/referral/ReferralForm.tsx";
// import StatusCheck from "./pages/status/StatusCheck.tsx";
// import RequestReport from "./pages/report/RequestReport.tsx";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "";

// Layout ที่ใช้ App โดยดูจาก path
const UserLayout: React.FC = () => {
  return (
    <App>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/animals" element={<AnimalPage />} />
        {/* <Route path="/referral" element={<ReferralForm />} />
        <Route path="/status" element={<StatusCheck />} />
        <Route path="/report" element={<RequestReport />} /> */}
      </Routes>
    </App>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleReCaptchaProvider
        reCaptchaKey={siteKey}
        scriptProps={{ async: true, defer: true }}
      >
        <Routes>
          {/* Public */}
          <Route path="/" element={<SignIn />} />

          {/* Private - User Dashboard */}
          <Route path="/novel/*" element={<UserLayout />} />
        </Routes>
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  </StrictMode>,
);
