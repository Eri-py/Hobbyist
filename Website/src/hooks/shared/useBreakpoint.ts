import { createContext, useContext } from "react";

type BreakpointContextTypes = { isDesktop: boolean };

export const BreakpointContext = createContext<BreakpointContextTypes | null>(null);

export function useBreakpoint() {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error("useBreakpoint must be used within a BreakpointProvider.");
  }
  return context;
}
