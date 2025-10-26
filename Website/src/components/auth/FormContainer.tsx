import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export function FormContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: { md: "center" },
        justifyContent: "center",
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
}
