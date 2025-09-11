import type { ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { BreakpointContext } from "@/hooks/shared/useBreakpoint";

type BreakpointProviderTypes = {
  children: ReactNode;
};
export function BreakpointProvider({ children }: BreakpointProviderTypes) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const value = { isDesktop: isDesktop };

  return <BreakpointContext.Provider value={value}>{children}</BreakpointContext.Provider>;
}
