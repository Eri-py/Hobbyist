import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

type HorizontalLinearStepperProps = {
  steps: string[];
  activeStep: number;
  setActiveStep: (value: number) => void;
};

export function HorizontalLinearStepper({ steps, activeStep }: HorizontalLinearStepperProps) {
  return (
    <Stepper activeStep={activeStep} alternativeLabel>
      {steps.map((label) => {
        return (
          <Step key={label}>
            <StepLabel
              id={label}
              color="primary"
              slotProps={{
                label: {
                  sx: { fontSize: 14, "&.MuiStepLabel-label": { marginTop: 0.5 } },
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
}
