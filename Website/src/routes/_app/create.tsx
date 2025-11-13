import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { useTheme } from "@mui/material/styles";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { CreateStepIndicator } from "@/components/create/CreateStepIndicator";
import { MobileImageDisplay } from "@/components/create/MobileImageDisplay";
import { MobileUploadArea } from "@/components/create/MobileUploadArea";
import { DesktopImageDisplay } from "@/components/create/DesktopImageDisplay";
import { DesktopUploadArea } from "@/components/create/DesktopUploadArea";
import Button from "@mui/material/Button";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { isDesktop } = useBreakpoint();
  const { files, getRootProps, getInputProps, isDragActive } = useMediaUpload();
  const [activeStep, setActiveStep] = useState(0);
  const [condition, setCondition] = useState("");
  const theme = useTheme();

  const handleChange = (event: SelectChangeEvent) => {
    setCondition(event.target.value as string);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => Math.min(prevActiveStep + 1, 2));
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  // Configure mobile header
  const mobileHeaderConfig = useMemo(
    () => ({
      left: (
        <IconButton onClick={handleBack} disabled={activeStep === 0}>
          <KeyboardArrowLeft />
        </IconButton>
      ),
      center: <CreateStepIndicator activeStep={activeStep} maxSteps={3} />,
      right: (
        <IconButton onClick={handleNext} disabled={activeStep === 2}>
          <KeyboardArrowRight />
        </IconButton>
      ),
    }),
    [activeStep]
  );
  useMobileHeaderConfig(mobileHeaderConfig);

  return (
    <Stack gap={3} flex={1}>
      {isDesktop ? (
        <Stack maxWidth={700} width="100%" marginX="auto" gap={2}>
          <Paper
            sx={{
              display: "flex",
              width: "100%",
              aspectRatio: 2 / 1,
              borderRadius: 3,
              padding: files.length > 0 ? 3 : 0,
            }}
          >
            {files.length > 0 ? (
              <DesktopImageDisplay files={files} getRootProps={getRootProps} />
            ) : (
              <DesktopUploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
            )}
          </Paper>
          {/* Title of the post */}
          <TextField variant="outlined" label="Title" fullWidth required />

          {/* Description for the post */}
          <TextField
            label="Description"
            multiline
            rows={6}
            fullWidth
            placeholder="Type description here..."
            variant="outlined"
            slotProps={{
              htmlInput: {
                sx: {
                  resize: "vertical",
                  overflow: "auto",
                  maxHeight: 500,
                },
              },
            }}
          />
          {/* Condition of the product */}
          <FormControl fullWidth required>
            <InputLabel id="condition-select-label">Condition</InputLabel>
            <Select
              labelId="condition-select-label"
              id="condition-select"
              value={condition}
              label="Condition"
              onChange={handleChange}
            >
              <MenuItem value={0}>Mint</MenuItem>
              <MenuItem value={1}>Good</MenuItem>
              <MenuItem value={2}>Okay</MenuItem>
              <MenuItem value={2}>Poor</MenuItem>
            </Select>
          </FormControl>

          {/* Available for trade or not */}
          <Paper sx={{ borderRadius: 3, width: "100%", padding: 2 }}>
            <FormControlLabel control={<Checkbox />} label="Available for trade" />

            <Stack
              border={`1px groove ${theme.palette.primary.main}`}
              borderRadius={3}
              padding={2}
              gap={1}
            >
              <Typography>What are you looking for?</Typography>
              <TextField
                fullWidth
                placeholder="e.g. Blastoise cards, sealed booster packs, vintage items"
              />
            </Stack>
          </Paper>
          <Stack direction="row" gap={1} width="100%">
            <Button variant="outlined" size="large" sx={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" size="large" sx={{ flex: 1 }}>
              Create Post
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack flex={1}>
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
      )}

      {/* Stores all uploaded content */}
      <input {...getInputProps()} />
    </Stack>
  );
}
