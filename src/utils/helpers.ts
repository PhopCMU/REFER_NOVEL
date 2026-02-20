import CryptoJS from "crypto-js";
import type {
  DataFormLoginProps,
  DataFormSubmitProps,
  FeedbackProps,
  FormPetProp,
  PayloadCreatedOwner,
  PayloadFetchOwner,
  PayloadUpdateOwner,
  WorkplacePayload,
} from "../types/type";

export const encryptData = (data: FeedbackProps | string) => {
  const dataToEncrypt = JSON.stringify(data);
  const secretKey =
    import.meta.env.VITE_CRYPTO_KEY || "default_secret_key_1234";
  const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, secretKey).toString();
  return encrypted;
};

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

// === ToLowerCase === //
export const toLowerStr = (val: any) => String(val ?? "").toLowerCase();
