import { useEffect, type ReactNode } from "react";

import { axiosInstance } from "@/api/axiosInstance";
import { AuthContext, useAuthProvider } from "@hobbyist/hooks";
import * as TokenManager from "@/api/tokenManager";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { value, isPending, isError } = useAuthProvider(axiosInstance);

  useEffect(() => {
    if (!isPending && !isError && value.isAuthenticated === false) {
      void TokenManager.clearTokens();
    }
  }, [isPending, isError, value.isAuthenticated]);

  if (isPending) {
    return <></>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
