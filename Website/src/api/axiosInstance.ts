import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Platform: "web",
  },
});

let isRefreshing = false;
const failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] =
  [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue.length = 0;
};

const getNewAccessToken = () => {
  return axiosInstance.post("auth/refresh-token");
};

type CustomAxiosRequestConfig = { _retry?: boolean } & InternalAxiosRequestConfig;

axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config as CustomAxiosRequestConfig;

  if (error.response?.status !== 401) {
    return Promise.reject(error);
  }

  // Never try to refresh when the refresh endpoint itself fails
  if (originalRequest.url?.includes("auth/refresh-token")) {
    return Promise.reject(error);
  }

  if (originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then(() => axiosInstance.request(originalRequest))
      .catch((err) => Promise.reject(err));
  }

  isRefreshing = true;
  try {
    await getNewAccessToken();
    processQueue();
    return axiosInstance.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
});
