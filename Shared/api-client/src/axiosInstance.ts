import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

export function createAxiosInstance(baseURL: string): AxiosInstance {
  const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 5000,
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
  };

  const getNewAccessToken = () => {
    return axiosInstance.get("auth/refresh-token");
  };

  type CustomAxiosRequestConfig = { _retry?: boolean } & InternalAxiosRequestConfig;

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

  return axiosInstance;
}
