import { encryptData } from "./helpers";
import { api } from "../api/axios";
import axios from "axios";

const TOKEN_KEY = "referral_token";

// ========================
// Token Management
// ========================

export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  // currentUser = null; <-- Removed
};

// ========================
// JWT Payload Parsing
// ========================

const decodeBase64Url = (base64Url: string): string => {
  // แปลง Base64Url เป็น Base64 ปกติ
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // เติม padding ถ้าจำเป็น
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  base64 = base64 + padding;

  // แปลงเป็น Uint8Array
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // แปลงเป็น UTF-8 string
  return new TextDecoder("utf-8").decode(bytes);
};

export const getAdminFromToken = (): {
  cmuitaccount_name?: string;
  fname?: string;
  lname?: string;
  email?: string;
  permission?: string | string[];
  exp?: number;
  [key: string]: any;
} | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = decodeBase64Url(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch (e) {
    console.error("Failed to parse token payload:", e);
    removeToken();
    return null;
  }
};

export const getUserFromToken = (): {
  cecode: string;
  codeId: string;
  email: string;
  exp: number;
  fnameEn: string;
  lnameEn: string;
  foodtype: string;
  points: number;
  role: string;
  [key: string]: any;
} | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = decodeBase64Url(payloadBase64);
    const payload = JSON.parse(payloadJson);

    return payload;
  } catch (e) {
    console.error("Failed to parse token payload:", e);
    removeToken();
    return null;
  }
};

export const fetchUserProfile = async (): Promise<{
  cecode: string;
  codeId: string;
  email: string;
  fnameEn: string;
  lnameEn: string;
  foodtype: string;
  points: number;
  role: string;
  [key: string]: any;
} | null> => {
  try {
    const user = getUserFromToken();
    if (!user) {
      removeToken();
      return null;
    }

    if (!getToken()) return null;

    const encryptedData = encryptData(user.codeId);

    const response = await api.get(
      `/api/pgt/user/profile?data=${encodeURIComponent(encryptedData)}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    if (response.data && response.data.success) {
      console.log("Fetched user profile:", response.data.point);
      return response.data.point;
    }

    console.warn("Unexpected profile response:", response.data);
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

// ========================
// Authentication Checks
// ========================

export const isTokenValid = (token: string): boolean => {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = decodeBase64Url(payloadBase64); // ✅ ใช้ฟังก์ชันที่รองรับ UTF-8
    const payload = JSON.parse(payloadJson);
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (e) {
    return false;
  }
};

// ตรวจสอบ offline (เร็ว) — ใช้ใน PrivateRoute และ SignIn
export const isAuthenticatedLocally = (): boolean => {
  const token = getToken();
  return token ? isTokenValid(token) : false;
};

// ตรวจสอบกับเซิร์ฟเวอร์ (ปลอดภัยสุด) — ใช้เมื่อจำเป็น
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getToken();
  if (!token || !isTokenValid(token)) {
    removeToken();
    return false;
  }

  try {
    const response = await api.get("/api/auth/info", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data?.payload) {
      // currentUser = response.data.payload; <-- Removed
      return true;
    } else {
      removeToken();
      return false;
    }
  } catch (error) {
    console.warn("Authentication check failed:", error);
    removeToken();
    return false;
  }
};

// ========================
// External User Info (from CMU)
// ========================

export const getUserInfo = async (token: string) => {
  try {
    const res = await axios.get(
      import.meta.env.VITE_PUBLIC_BASICINFO_URL || "",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Get user info error:", error);
    return null;
  }
};

// ========================
// Register / Encode User → Get App Token
// ========================

export const userEncode = async (userInfo: any) => {
  try {
    const response = await api.post("/api/auth/add/account", userInfo);

    console.log("User registration response:", response.data);

    if (response.data?.token.access_token) {
      return { accessToken: response.data.token.access_token };
    }
    return null;
  } catch (error) {
    console.error("User registration failed:", error);
    return null;
  }
};
