import { useState, type ReactNode } from "react";

import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider } from "@mui/material/styles";

import { ThemeToggleContext, type ThemeToggleTypes } from "@/hooks/shared/useThemeToggle";
import { mainTheme } from "@/themes/mainTheme";

type CustomThemeProviderProps = {
  children: ReactNode;
};

export function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  const systemThemeIsDark = useMediaQuery("(prefers-color-scheme: dark)");

  const getThemeMode = () => {
    const currentThemeMode = localStorage.getItem("currentThemeMode");
    if (currentThemeMode === "light" || currentThemeMode === "dark") {
      return currentThemeMode;
    }
    return systemThemeIsDark ? "dark" : "light";
  };

  // set current mode based on value in localstorage or system theme
  const [mode, setMode] = useState<"light" | "dark">(getThemeMode());
  const theme = mainTheme(mode === "dark");

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    // Update mode state and localstorage
    setMode(newMode);
    localStorage.setItem("currentThemeMode", newMode);
  };

  const value: ThemeToggleTypes = {
    mode: mode,
    toggleTheme: toggleTheme,
  };

  return (
    <ThemeToggleContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
