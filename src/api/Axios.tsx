import axios from "axios";
import { getToken } from "../utils/authUtils";
import { setupAxiosLoading } from "./AxiosLoading";

// 1. สร้าง Instance พื้นฐาน
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: false,
  timeout: 15000,
});

// 2. สร้าง Instance สำหรับ Auth (ไม่ต้องใส่ headers ตรงนี้)
export const apiWithAuth = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 15000,
});

// 3. ใช้ Interceptor เพื่อดึง Token มาใส่ "ก่อน" ส่ง Request ทุกครั้ง
apiWithAuth.interceptors.request.use(
  (config) => {
    const token = getToken(); // ดึงค่าล่าสุดจาก Storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ตั้งค่า Loading (ถ้าต้องการใช้กับทั้งคู่)
setupAxiosLoading(api);
setupAxiosLoading(apiWithAuth);
