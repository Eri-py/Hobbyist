// features/auth/contexts/AuthLayoutContext.tsx
import { createContext, useContext } from "react";
import { type Theme } from "@mui/material/styles";

type AuthLayoutContextType = {
  theme: Theme;
  isSmOrLarger: boolean;
};

export const AuthLayoutContext = createContext<AuthLayoutContextType | null>(null);

export const useAuthLayout = () => {
  const context = useContext(AuthLayoutContext);
  if (!context) {
    throw new Error("useAuthLayout must be used within an AuthLayoutProvider");
  }
  return context;
};
