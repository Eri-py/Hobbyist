import { createContext, useContext } from "react";

import type { components } from "@/api/types";

export type AuthContextTypes = components["schemas"]["GetUserResponse"];
export const AuthContext = createContext<AuthContextTypes | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
