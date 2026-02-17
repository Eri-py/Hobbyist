import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { components } from "@hobbyist/types";

export type AuthContextTypes = components["schemas"]["GetUserResponse"];
type GetUserResponse = components["schemas"]["GetUserResponse"];

export const AuthContext = createContext<AuthContextTypes | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

export const USER_DETAILS_QUERY_KEY = ["userDetails"] as const;

export function useAuthProvider(axiosInstance: AxiosInstance) {
  const { data, isPending } = useQuery({
    queryKey: USER_DETAILS_QUERY_KEY,
    queryFn: () => axiosInstance.get<GetUserResponse>("auth/get-user-details"),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const value: AuthContextTypes = useMemo(
    () => ({
      isAuthenticated: data?.data.isAuthenticated ?? false,
      user: data?.data.user ?? null,
    }),
    [data],
  );

  return { value, isPending };
}
