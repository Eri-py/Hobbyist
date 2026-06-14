import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import * as TokenManager from "@/api/tokenManager";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type CustomAxiosRequestConfig = { _retry?: boolean } & InternalAxiosRequestConfig;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

  const response = await axiosInstance.post("/auth-session/refresh-token", { refreshToken });

  return response.data;
};

// Request interceptor - attach access token
axiosInstance.interceptors.request.use(async (config) => {
  if (config.url?.includes("auth-session/refresh-token")) {
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

  if (originalRequest.url?.includes("auth-session/refresh-token")) {
    await TokenManager.clearTokens();
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
    if (!newTokens) {
      processQueue(new Error("Missing refresh token"));
      await TokenManager.clearTokens();
      return Promise.reject(new Error("Missing refresh token"));
    }

    await TokenManager.storeTokens(newTokens);
    processQueue();
    return axiosInstance.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    // Only wipe tokens on an explicit 401; network/5xx don't mean the token is invalid.
    if (refreshError instanceof AxiosError && refreshError.response?.status === 401) {
      await TokenManager.clearTokens();
    }
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
});
