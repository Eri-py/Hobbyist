import type { ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type FormContainerProps = { children: ReactNode; step: number };

export function FormContainer({ children, step }: FormContainerProps) {
  const theme = useTheme();
  const isDesktop = useDeviceType();
  return (
    <Stack
      padding={1.5}
      gap={2}
      flex={1}
      maxWidth={step === 4 ? 600 : !isDesktop ? "100%" : 400}
      height="fit-content"
      bgcolor={theme.palette.background.default}
    >
      {children}
    </Stack>
  );
}
