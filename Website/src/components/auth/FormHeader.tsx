import { type ReactNode } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type FormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  currentStep: string;
  totalSteps: string;
};

export function FormHeader({ header, subtext, currentStep, totalSteps }: FormHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack>
        <Typography fontWeight={500} fontSize={24} color="textPrimary">
          {header}
        </Typography>
        <Typography fontWeight={200} fontSize={15} color="textSecondary">
          {subtext}
        </Typography>
      </Stack>
      <Stack>
        <Typography fontWeight={200} fontSize={15} color="text.secondary">
          Step {currentStep} / {totalSteps}
        </Typography>
      </Stack>
    </Stack>
  );
}
