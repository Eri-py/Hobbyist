import { axiosInstance } from "@/api/axiosInstance";
import { AuthContext, useAuthProvider } from "@hobbyist/hooks";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { value, isPending } = useAuthProvider(axiosInstance);

  if (isPending) {
    return <></>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
