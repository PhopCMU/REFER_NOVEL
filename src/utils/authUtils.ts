import { api } from "../api/Axios";
import axios from "axios";
import type { CmuItAccount } from "../types/type";
import { encryptDataNew } from "./helpers";

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
// JWT Payload Parsing (Frontend)
// ========================

/**
 * ฟังก์ชันสำหรับถอดรหัส Base64Url เป็น JSON Object
 * รองรับภาษาไทย (UTF-8) อย่างถูกต้อง
 */
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const getUserFromToken = (): {
  [x: string]: any;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  exp?: number;
  iss?: string;
  ceLicense?: string;
  aud: string;
} | null => {
  const token = getToken(); // ดึงจาก LocalStorage/Cookie
  if (!token) return null;

  const payload = parseJwt(token);

  if (!payload) {
    console.error("Failed to parse token payload");
    removeToken();
    return null;
  }

  // ตรวจสอบเบื้องต้นว่า Token หมดอายุหรือยัง (ฝั่ง Client)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    console.warn("Token has expired");
    removeToken();
    return null;
  }

  return payload;
};

export const getAdminFromToken = (): {
  cmuitaccount_name?: string;
  fname?: string;
  lname?: string;
  email?: string;
  permissions?: string | string[];
  permission?: string | string[];
  exp?: number;
  [key: string]: any;
} | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = parseJwt(token);
    return payload;
  } catch (e) {
    console.error("Failed to parse token payload:", e);
    removeToken();
    return null;
  }
};

// ========================
// Authentication Checks
// ========================

export const isTokenValid = (token: string): boolean => {
  try {
    // 1. parseJwt คืนค่าเป็น Object { id, email, exp, ... } หรือ null
    const payload = parseJwt(token);

    if (!payload || !payload.exp) {
      console.error("Invalid token structure");
      return false;
    }

    // console.log("Token payload:", payload); // ตรวจสอบค่าที่นี่

    // 2. ตรวจสอบเวลาหมดอายุ (หน่วยวินาที)
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (e) {
    console.error("Error validating token:", e);
    return false;
  }
};

// ตรวจสอบ offline (เร็ว) — ใช้ใน PrivateRoute เพื่อกันคนไม่ล็อกอินเข้าหน้าเว็บ
export const isAuthenticatedLocally = (): boolean => {
  const token = getToken();
  return !!token && isTokenValid(token);
};

// ตรวจสอบกับเซิร์ฟเวอร์ (ปลอดภัยสุด)
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getToken();

  // เช็คเบื้องต้นก่อนส่งไปหนัก Server
  if (!token || !isTokenValid(token)) {
    removeToken();
    return false;
  }

  try {
    // ส่งไปให้ Backend ตรวจสอบ Signature (Verify ด้วย Secret Key)
    const response = await api.get("/auth/info", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
      return true;
    } else {
      removeToken();
      return false;
    }
  } catch (error) {
    console.warn("Authentication check failed (Server-side):", error);
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

export const exchangeCodeForSession = async (code: string) => {
  try {
    const exchangeRes = await api.post("/auth/exchange-code", { code });
    let userInfo;

    if (!exchangeRes.data) {
      return {
        status: 4000,
        message: "User registration failed",
        success: false,
      };
    }

    if (exchangeRes.data?.accessToken) {
      userInfo = await getUserInfo(exchangeRes.data.accessToken);
    } else if (exchangeRes.data?.cmuitaccount_name) {
      userInfo = exchangeRes.data;
    } else {
      return {
        status: 4000,
        message: "User registration failed",
        success: false,
      };
    }

    if (!userInfo?.cmuitaccount_name) {
      return {
        status: 4001,
        message: "ไม่พบข้อมูลบัญชี CMU IT Account ของคุณในระบบ",
        success: false,
      };
    }

    const registerRes = await userEncode(userInfo);
    if (!registerRes?.accessToken) {
      return {
        status: 4002,
        message: "ระบบยืนยันตัวตนล้มเหลว",
        success: false,
      };
    }

    saveToken(registerRes.accessToken);

    // ✅ สำเร็จ: return ข้อมูล token และ user
    return {
      status: 200,
      message: "เข้าสู่ระบบสำเร็จ",
      success: true,
      data: registerRes,
    };
  } catch (error) {
    console.error("Exchange code error:", error);
    return {
      status: 5000,
      message: "Exchange code failed",
      success: false,
    };
  }
};

export const userEncode = async (userInfo: CmuItAccount) => {
  try {
    const encyptedDataBody = encryptDataNew(userInfo);

    const response = await api.post("/auth/cmuitaccount", {
      encodedData: encyptedDataBody,
    });

    if (response.data?.token) {
      return { accessToken: response.data.token };
    }
    return null;
  } catch (error) {
    console.error("User registration failed:", error);
    return null;
  }
};
