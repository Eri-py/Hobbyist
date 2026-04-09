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
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center"
      }}>
      <Stack>
        <Typography
          color="textPrimary"
          sx={{
            fontWeight: 500,
            fontSize: 24
          }}>
          {header}
        </Typography>
        <Typography
          color="textSecondary"
          sx={{
            fontWeight: 200,
            fontSize: 15
          }}>
          {subtext}
        </Typography>
      </Stack>
      <CircularProgressBar totalSteps={totalSteps} activeStep={activeStep} />
    </Stack>
  );
}
