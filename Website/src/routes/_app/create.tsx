import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { FormProvider } from "react-hook-form";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { CreateStepIndicator } from "@/components/create/mobile/CreateStepIndicator";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import { MobileCreateForm } from "@/components/create/mobile/MobileCreateForm";
import { useCreate } from "@/hooks/create/useCreate";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { isDesktop } = useDeviceType();
  const { files, getRootProps, getInputProps, isDragActive, removeFile, reorderFiles } =
    useMediaUpload();
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
    [activeStep, files, handleBack, handleNext],
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
            <DesktopCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
              isSubmitting={isSubmitting}
            />
          ) : (
            <MobileCreateForm
              files={files}
              getRootProps={getRootProps}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
              activeStep={activeStep}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Stores all uploaded content */}
          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
