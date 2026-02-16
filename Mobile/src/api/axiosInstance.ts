import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import * as TokenManager from "@/api/tokenManager";

const API_BASE_URL = "http://100.85.42.14:7001/api";

type CustomAxiosRequestConfig = { _retry?: boolean } & InternalAxiosRequestConfig;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { Platform: "mobile" },
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

const refreshAccessToken = async () => {
  const refreshToken = await TokenManager.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await axiosInstance.post("auth/refresh-token-mobile", {
    refreshToken,
  });

  return response.data;
};

// Request interceptor - attach access token
axiosInstance.interceptors.request.use(async (config) => {
  if (config.url?.includes("auth/refresh-token-mobile")) {
    return config;
  }

  const accessToken = await TokenManager.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Response interceptor - handle 401 and refresh token
axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config as CustomAxiosRequestConfig;

  if (error.response?.status !== 401) {
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
    const newTokens = await refreshAccessToken();
    await TokenManager.storeTokens(newTokens);
    processQueue();
    return axiosInstance.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    await TokenManager.clearTokens();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
});
