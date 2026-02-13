import { type AxiosInstance } from "axios";

let showLoadingFn: (() => void) | null = null;
let hideLoadingFn: (() => void) | null = null;

export const bindLoading = (
  showLoading: () => void,
  hideLoading: () => void
) => {
  showLoadingFn = showLoading;
  hideLoadingFn = hideLoading;
};

export const setupAxiosLoading = (api: AxiosInstance) => {
  let requestCount = 0;

  api.interceptors.request.use(
    (config) => {
      requestCount++;
      showLoadingFn?.();
      return config;
    },
    (error) => {
      requestCount--;
      if (requestCount <= 0) hideLoadingFn?.();
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      requestCount--;
      if (requestCount <= 0) hideLoadingFn?.();
      return response;
    },
    (error) => {
      requestCount--;
      if (requestCount <= 0) hideLoadingFn?.();
      return Promise.reject(error);
    }
  );
};
