import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { FormProvider } from "react-hook-form";

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
import Select from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { CreateStepIndicator } from "@/components/create/CreateStepIndicator";
import { MobileImageDisplay } from "@/components/create/MobileImageDisplay";
import { MobileUploadArea } from "@/components/create/MobileUploadArea";
import { DesktopImageDisplay } from "@/components/create/DesktopImageDisplay";
import { DesktopUploadArea } from "@/components/create/DesktopUploadArea";
import { useCreate } from "@/hooks/create/useCreate";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { isDesktop } = useDeviceType();
  const { files, getRootProps, getInputProps, isDragActive, removeFile } = useMediaUpload();
  const theme = useTheme();

  const {
    methods,
    activeStep,
    serverErrorMessage,
    handleNext,
    handleBack,
    handleSubmit,
    isSubmitting,
  } = useCreate();

  const {
    register,
    formState: { errors },
  } = methods;

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
        <IconButton onClick={() => handleNext(files)} disabled={activeStep === 2}>
          <KeyboardArrowRight />
        </IconButton>
      ),
    }),
    [activeStep, files, handleBack, handleNext]
  );
  useMobileHeaderConfig(mobileHeaderConfig);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(() => handleSubmit(files))}
        style={{ display: "flex", flex: 1 }}
      >
        <Stack gap={3} flex={1} padding={1}>
          {serverErrorMessage && (
            <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
              {serverErrorMessage}
            </Alert>
          )}

          {isDesktop ? (
            <Stack maxWidth={700} width="100%" marginX="auto" gap={2}>
              <Paper
                sx={{
                  display: "flex",
                  width: "100%",
                  aspectRatio: 5 / 2,
                  borderRadius: 3,
                  padding: files.length > 0 ? 3 : 0,
                }}
              >
                {files.length > 0 ? (
                  <DesktopImageDisplay
                    files={files}
                    getRootProps={getRootProps}
                    removeFile={removeFile}
                  />
                ) : (
                  <DesktopUploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
                )}
              </Paper>

              {/* Title of the post */}
              <TextField
                {...register("title")}
                variant="outlined"
                label="Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
              />

              {/* Description for the post */}
              <TextField
                {...register("description")}
                label="Description"
                multiline
                rows={6}
                fullWidth
                placeholder="Type description here..."
                variant="outlined"
                error={!!errors.description}
                helperText={errors.description?.message}
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
              <FormControl fullWidth error={!!errors.condition}>
                <InputLabel id="condition-select-label">Condition</InputLabel>
                <Select
                  {...register("condition")}
                  labelId="condition-select-label"
                  id="condition-select"
                  label="Condition"
                  defaultValue=""
                >
                  <MenuItem value={0}>Mint</MenuItem>
                  <MenuItem value={1}>Good</MenuItem>
                  <MenuItem value={2}>Okay</MenuItem>
                  <MenuItem value={3}>Poor</MenuItem>
                </Select>
                {errors.condition && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.condition.message}
                  </Typography>
                )}
              </FormControl>

              {/* Available for trade or not */}
              <Paper sx={{ borderRadius: 3, width: "100%", padding: 2 }}>
                <FormControlLabel
                  control={<Checkbox {...register("availableForTrade")} />}
                  label="Available for trade"
                />

                <Stack
                  border={`1px groove ${theme.palette.primary.main}`}
                  borderRadius={3}
                  padding={2}
                  gap={1}
                >
                  <Typography>What are you looking for?</Typography>
                  <TextField
                    {...register("lookingFor")}
                    fullWidth
                    placeholder="e.g. Blastoise cards, sealed booster packs, vintage items"
                    error={!!errors.lookingFor}
                    helperText={errors.lookingFor?.message}
                  />
                </Stack>
              </Paper>

              <Stack direction="row" gap={1} width="100%">
                <Button variant="outlined" size="large" sx={{ flex: 1 }} type="button">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ flex: 1 }}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Post"}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack flex={1}>
              {files.length > 0 ? (
                <MobileImageDisplay
                  files={files}
                  getRootProps={getRootProps}
                  removeFile={removeFile}
                />
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
      </form>
    </FormProvider>
  );
}
