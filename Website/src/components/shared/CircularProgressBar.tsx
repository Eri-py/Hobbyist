import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

type CircularProgressBarProps = {
  totalSteps: number;
  activeStep: number;
  radius?: number;
};

export function CircularProgressBar({
  totalSteps,
  activeStep,
  radius = 20,
}: CircularProgressBarProps) {
  const theme = useTheme();

  const stroke = 2.5;
  const normalizedR = radius - stroke;
  const circumference = 2 * Math.PI * normalizedR;
  const progress = totalSteps > 1 ? (activeStep / (totalSteps - 1)) * circumference : circumference;

  const displayStep = activeStep + 1;

  return (
    <Box sx={{ position: "relative", width: radius * 2, height: radius * 2, flexShrink: 0 }}>
      <svg
        width={radius * 2}
        height={radius * 2}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedR}
          fill="none"
          stroke={theme.palette.divider}
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedR}
          fill="none"
          stroke={theme.palette.primary.light}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>

      {/* Step number overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: theme.palette.primary.light, lineHeight: 1 }}
        >
          {displayStep}
        </Typography>
      </Box>
    </Box>
  );
}
