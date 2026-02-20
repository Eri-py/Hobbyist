import { createFileRoute } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import { MobileCreateForm } from "@/components/create/mobile/MobileCreateForm";
import { ErrorStack } from "@/components/shared/ErrorStack";
import { useCreate } from "@/hooks/create/useCreate";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { isDesktop } = useDeviceType();
  const {
    files,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    reorderFiles,
    errors,
    removeError,
  } = useMediaUpload();
  const theme = useTheme();

  const { methods, serverErrorMessage, handleSubmit, isSubmitting } = useCreate();

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(() => handleSubmit(files))}
        style={{ display: "flex", flex: 1 }}
      >
        <Stack gap={3} flex={1}>
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
            <MobileCreateForm files={files} getRootProps={getRootProps} removeFile={removeFile} />
          )}

          {/* Error notifications */}
          <ErrorStack
            errors={errors}
            onRemoveError={removeError}
            position={isDesktop ? "top-right" : "bottom-center"}
          />

          {/* Stores all uploaded content */}
          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
