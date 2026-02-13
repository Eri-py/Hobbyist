import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useEffect, useMemo } from "react";

import { useTokenStorage } from "@/hooks/auth/useTokenStorage";

const API_BASE_URL = "http://100.85.42.14:7001/api";

type CustomAxiosRequestConfig = InternalAxiosRequestConfig;

export function useMobileAxiosInstance(): AxiosInstance {
  const { getAccessToken } = useTokenStorage();
  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Platform: "mobile",
      },
    });
  }, []);

  useEffect(() => {
    const requestId = axiosInstance.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        const accessToken = await getAccessToken();
        if (accessToken) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestId);
    };
  }, [axiosInstance, getAccessToken]);

  return axiosInstance;
}
