import type { getUserResponse } from "@/api/AuthApi";
import { createContext, useContext } from "react";

type AuthContextTypes = getUserResponse;
export const AuthContext = createContext<AuthContextTypes | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
