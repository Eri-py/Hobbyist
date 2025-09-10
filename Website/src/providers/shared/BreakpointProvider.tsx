import type { ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { BreakpointContext } from "@/hooks/shared/useBreakpoint";

type BreakpointProviderTypes = {
  children: ReactNode;
};
export function BreakpointProvider({ children }: BreakpointProviderTypes) {
  const theme = useTheme();
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up("sm"));

  const value = { isSmOrLarger };

  return <BreakpointContext.Provider value={value}>{children}</BreakpointContext.Provider>;
}
