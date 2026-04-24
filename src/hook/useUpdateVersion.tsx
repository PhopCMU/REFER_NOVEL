import { useState } from "react";
import { removeToken } from "../utils/authUtils";

const APP_VERSION_KEY = "app_version";

export function useUpdateVersion(): {
  needsUpdate: boolean;
  currentVersion: string;
  doUpdate: () => void;
} {
  const [needsUpdate] = useState<boolean>(() => {
    const stored = localStorage.getItem(APP_VERSION_KEY);
    if (!stored) {
      // First visit — silently record the version and continue
      localStorage.setItem(APP_VERSION_KEY, __APP_VERSION__);
      return false;
    }
    console.log("Current version:", __APP_VERSION__, "Stored version:", stored);
    return stored !== __APP_VERSION__;
  });

  const doUpdate = () => {
    localStorage.setItem(APP_VERSION_KEY, __APP_VERSION__);
    removeToken();
    window.location.reload();
  };

  return { needsUpdate, currentVersion: __APP_VERSION__, doUpdate };
}
