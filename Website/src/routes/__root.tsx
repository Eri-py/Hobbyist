import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CssBaseline from "@mui/material/CssBaseline";

import { BreakpointContext } from "@/hooks/shared/useBreakpoint";
import { mainTheme } from "@/themes/mainTheme";
import { ThemeToggleContext, type ThemeToggleTypes } from "@/hooks/shared/useThemeToggle";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  // Initialize theme mode and theme from localStorage or system preference.
  const systemTheme = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const currentThemeMode = localStorage.getItem("currentThemeMode");
    if (currentThemeMode === "light" || currentThemeMode === "dark") {
      return currentThemeMode;
    }
    return systemTheme ? "dark" : "light";
  });
  const theme = mainTheme(mode === "dark");

  // XS would be used for mobile screens while the others would be tablet and larger.
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up("sm"));

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";

    // Update mode state and localstorage
    setMode(newMode);
    localStorage.setItem("currentThemeMode", newMode);
  };

  const themeProviderValues: ThemeToggleTypes = {
    mode: mode,
    toggleTheme: toggleTheme,
  };

  return (
    <ThemeToggleContext.Provider value={themeProviderValues}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BreakpointContext.Provider value={{ isSmOrLarger }}>
          <Outlet />
        </BreakpointContext.Provider>
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
