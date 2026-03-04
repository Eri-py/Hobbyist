import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { CircularProgressBar } from "@/components/shared/CircularProgressBar";

type MobileHeaderProps = {
  totalSteps: number;
  activeStep: number;
  stepLabel: string;
  onNext: () => void;
  onBack: () => void;
};

export function MobileHeader({
  totalSteps,
  activeStep,
  stepLabel,
  onNext,
  onBack,
}: MobileHeaderProps) {
  const displayStep = activeStep + 1;

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={1.5}>
        <CircularProgressBar totalSteps={totalSteps} activeStep={activeStep} />

        <Stack gap={0.25}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2 }}
          >
            Step {displayStep} of {totalSteps}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
            {stepLabel}
          </Typography>
        </Stack>
      </Stack>

      {activeStep === 0 ? (
        <Button
          variant="text"
          type="button"
          size="small"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onNext}
          sx={{ "& .MuiButton-endIcon .MuiSvgIcon-root": { color: "primary.main" } }}
        >
          Next
        </Button>
      ) : (
        <Button
          variant="text"
          type="button"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={{ "& .MuiButton-startIcon .MuiSvgIcon-root": { color: "primary.main" } }}
        >
          Back
        </Button>
      )}
    </Stack>
  );
}
