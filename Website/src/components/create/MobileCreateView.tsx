import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

import { MobileUploadArea } from "./MobileUploadArea";
import { MobileImageDisplay } from "./MobileImageDisplay";

type MobileCreateViewProps = {
  files: File[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
};

export function MobileCreateView({
  files,
  getRootProps,
  activeStep,
  handleNext,
  handleBack,
}: MobileCreateViewProps) {
  const theme = useTheme();

  return (
    <Stack flex={1}>
      <MobileStepper
        variant="text"
        steps={3}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button size="small" onClick={handleNext} disabled={activeStep === 2}>
            Next
            {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            Back
          </Button>
        }
      />

      {files.length > 0 ? (
        <MobileImageDisplay files={files} getRootProps={getRootProps} />
      ) : (
        <MobileUploadArea getRootProps={getRootProps} />
      )}

      <Paper elevation={0} sx={{ padding: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Tip: Add multiple photos to show different angles
        </Typography>
      </Paper>
    </Stack>
  );
}
