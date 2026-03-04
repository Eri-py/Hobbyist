import { type ReactNode } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CircularProgressBar } from "@/components/shared/CircularProgressBar";

type FormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  activeStep: number;
  totalSteps: number;
};

export function FormHeader({ header, subtext, activeStep, totalSteps }: FormHeaderProps) {
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
      <Stack alignItems="center" gap={0.5}>
        <CircularProgressBar totalSteps={totalSteps} activeStep={activeStep} />
      </Stack>
    </Stack>
  );
}
