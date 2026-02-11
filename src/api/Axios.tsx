import axios from "axios";
import { getToken } from "../utils/authService";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: false,
});

export const apiWithAuth = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
