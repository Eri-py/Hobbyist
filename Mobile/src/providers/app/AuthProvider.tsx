import { useEffect } from "react";

import { axiosInstance } from "@/api/axiosInstance";
import { AuthContext, useAuthProvider } from "@hobbyist/hooks";
import * as TokenManager from "@/api/tokenManager";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { value, isPending } = useAuthProvider(axiosInstance);

  useEffect(() => {
    if (!isPending && value.isAuthenticated === false) {
      void TokenManager.clearTokens();
    }
  });

  if (isPending) {
    return <></>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
