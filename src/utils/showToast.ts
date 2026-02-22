import { toast } from "react-toastify";

export const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  wran: (msg: string) => toast.warn(msg),
};
