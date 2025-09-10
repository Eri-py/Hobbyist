import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext, type AuthContextTypes } from "@/hooks/app/useAuth";
import { getUserDetails } from "@/api/AuthApi";
import { Loader } from "@/components/app/Loader";

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
    isAuthenticated: data?.data.isAuthenticated,
    user: data?.data.user,
  };

  if (isPending) return <Loader />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
