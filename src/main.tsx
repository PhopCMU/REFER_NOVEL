import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "material-symbols";
import "react-toastify/dist/ReactToastify.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ErrorBoundary from "./component/ErrorBoundary.tsx";
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* <AlertProvider> */}
      <GoogleReCaptchaProvider
        reCaptchaKey={siteKey}
        scriptProps={{ async: true, defer: true }}
      >
        <App />
      </GoogleReCaptchaProvider>
      {/* </AlertProvider> */}
    </ErrorBoundary>
  </StrictMode>,
);
