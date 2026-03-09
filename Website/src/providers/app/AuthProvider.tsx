import { type ReactNode } from "react";
import { axiosInstance } from "@/api/axiosInstance";
import { Loader } from "@/components/app/Loader";
import { AuthContext, useAuthProvider } from "@hobbyist/hooks";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { value, isPending } = useAuthProvider(axiosInstance);

  if (isPending) {
    return <Loader />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
