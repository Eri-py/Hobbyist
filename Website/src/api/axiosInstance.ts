import { createAxiosInstance } from "@hobbyist/api-client";

const API_BASE_URL = "https://localhost:7000/api";

export const axiosInstance = createAxiosInstance(API_BASE_URL);
