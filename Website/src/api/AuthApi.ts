import { axiosInstance } from "./axiosInstance";

// Get user response
export type getUserResponse = {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
  } | null;
};

// User verification Api calls
export const getUserDetails = () => {
  return axiosInstance.get("auth/get-user-details");
};
