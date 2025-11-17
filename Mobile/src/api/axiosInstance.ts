import { createAxiosInstance } from "@hobbyist/api-client";

const API_BASE_URL = "http://100.85.42.14:7001/api";
export const axiosInstance = createAxiosInstance(API_BASE_URL);
