import MobileStepper from "@mui/material/MobileStepper";
import { useTheme } from "@mui/material/styles";

type CreateStepIndicatorProps = {
  activeStep: number;
  maxSteps: number;
};

export function CreateStepIndicator({ activeStep, maxSteps }: CreateStepIndicatorProps) {
  const theme = useTheme();

  return (
    <MobileStepper
      variant="dots"
      steps={maxSteps}
      position="static"
      activeStep={activeStep}
      sx={{
        backgroundColor: "transparent",
        flexGrow: 1,
        justifyContent: "center",
        "& .MuiMobileStepper-dot": {
          backgroundColor: theme.palette.action.disabled,
        },
        "& .MuiMobileStepper-dotActive": {
          backgroundColor: theme.palette.primary.main,
        },
      }}
      nextButton={null}
      backButton={null}
    />
  );
}
