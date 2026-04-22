import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "material-symbols";
import "react-toastify/dist/ReactToastify.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ErrorBoundary from "./component/ErrorBoundary.tsx";

// NOTE: VITE_RECAPTCHA_SITE_KEY must be the public site-key only (never a secret)
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "";

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element with id 'root' not found in document.");
  throw new Error("Root element 'root' not found");
}

if (!siteKey) {
  // Inform developers in console when running without reCAPTCHA configured
  // (site-key is public; secret key must stay on the server)
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_RECAPTCHA_SITE_KEY is not set. Running without reCAPTCHA (site-key must be public).",
  );
}

const appElement = siteKey ? (
  <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true }}>
    <App />
  </GoogleReCaptchaProvider>
) : (
  <App />
);

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      {/* <AlertProvider> */}
      {appElement}
      {/* </AlertProvider> */}
    </ErrorBoundary>
  </StrictMode>,
);
