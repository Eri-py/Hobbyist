import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function NavbarContainer({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { isSmOrLarger } = useBreakpoint();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 1100,
        backgroundColor: "background.default",
        borderBottom: isSmOrLarger
          ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
          : undefined,
        height: isSmOrLarger ? "3.75rem" : "3.25rem",
      }}
    >
      {children}
    </Box>
  );
}
