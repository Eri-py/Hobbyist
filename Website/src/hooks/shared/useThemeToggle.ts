import { createContext, useContext } from "react";

export type ThemeToggleTypes = {
  mode: "light" | "dark";
  toggleTheme: () => void;
};

export const ThemeToggleContext = createContext<ThemeToggleTypes | null>(null);

export function useThemeToggle() {
  const context = useContext(ThemeToggleContext);
  if (!context) {
    throw new Error("useThemeToggle must be used within a ThemeToggleProvider.");
  }
  return context;
}
