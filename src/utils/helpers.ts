import CryptoJS from "crypto-js";
import type {
  CmuItAccount,
  DataFormLoginProps,
  DataFormSubmitProps,
  FeedbackProps,
  FormPetProp,
  GetReferralCasesProps,
  PayloadCheckOtpProps,
  PayloadCreatedOwner,
  PayloadFetchOwner,
  PayloadResetPassword,
  PayloadSendLinkResetPassword,
  PayloadUpdateOwner,
  ReferralDataPayload,
  WorkplacePayload,
} from "../types/type";

export const encryptDataNew = (
  data:
    | FeedbackProps
    | WorkplacePayload
    | DataFormSubmitProps
    | DataFormLoginProps
    | PayloadCreatedOwner
    | PayloadFetchOwner
    | PayloadUpdateOwner
    | FormPetProp
    | PayloadSendLinkResetPassword
    | PayloadCheckOtpProps
    | PayloadResetPassword
    | GetReferralCasesProps
    | CmuItAccount
    | string,
) => {
  const secretKey = import.meta.env.VITE_CRYPTO_KEY || "";

  const key = CryptoJS.SHA256(secretKey);
  const iv = CryptoJS.lib.WordArray.random(16);
  const dataString = JSON.stringify(data);

  const encrypted = CryptoJS.AES.encrypt(dataString, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.toString()}`;
};

// ─── useDecodecryptQuery  ───────────────────────────────────────────────────
export const useDecodecryptQuery = (data: string) => {
  const secretKey = import.meta.env.VITE_CRYPTO_KEY || "";
  try {
    const decodedData = decodeURIComponent(data);
    const parts = decodedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Format error: Missing IV or Ciphertext");
    }

    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const ciphertext = parts[1];

    const decrypt = (keyStr: string) => {
      const key = CryptoJS.SHA256(keyStr);
      const bytes = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return bytes.toString(CryptoJS.enc.Utf8);
    };

    let decryptedString = decrypt(secretKey);

    if (!decryptedString) {
      decryptedString = decrypt(secretKey);
    }

    if (!decryptedString) {
      throw new Error(
        "Malformed UTF-8 data - Key mismatch between Client and Server",
      );
    }

    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error: any) {
    console.error("Error in useDecodecryptQueryNew:", error);
    throw error;
  }
};

// ─── toLowerStr  ───────────────────────────────────────────────────
export const toLowerStr = (val: any) => String(val ?? "").toLowerCase();

// ─── Case Referral  ───────────────────────────────────────────────────
export const encryptReferralMetadata = (data: ReferralDataPayload) => {
  return encryptDataNew(data);
};

// ─── getStartOfDay  ───────────────────────────────────────────────────
export const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

// ─── getEndOfDay  ───────────────────────────────────────────────────
export const getEndOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};
