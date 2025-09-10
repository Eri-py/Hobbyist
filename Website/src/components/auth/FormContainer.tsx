import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export function FormContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: { sm: "center" },
        justifyContent: "center",
        background: {
          sm: "radial-gradient(ellipse 150% 100% at top left, #42a5f5 0%, rgba(21, 101, 192, 0.7) 40%, rgba(13, 71, 161, 0.3) 70%, transparent 100%), radial-gradient(ellipse 120% 80% at bottom right, #1565c0 0%, rgba(13, 71, 161, 0.5) 50%, transparent 80%), radial-gradient(circle at center, #181818 0%, #2c2c2c 100%)",
        },
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
}
