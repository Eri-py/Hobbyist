import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext, type AuthContextTypes } from "@/hooks/app/useAuth";
import { Loader } from "@/components/app/Loader";
import { axiosInstance } from "@/api/axiosInstance";
import type { components } from "@hobbyist/types";

type GetUserResponse = components["schemas"]["GetUserResponse"];

const getUserDetails = () => {
  return axiosInstance.get<GetUserResponse>("auth/get-user-details");
};

type AuthProviderTypes = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderTypes) {
  const { data, isPending } = useQuery({
    queryKey: ["userDetails"],
    queryFn: getUserDetails,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
  });

  const value: AuthContextTypes = {
    isAuthenticated: data?.data.isAuthenticated ?? false,
    user: data?.data.user ?? null,
  };

  if (isPending) return <Loader />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
