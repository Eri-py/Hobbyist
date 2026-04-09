import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useEffect, useMemo } from "react";
import type { KeyboardEvent } from "react";

import Stack from "@mui/material/Stack";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { ErrorStack } from "@/components/shared/ErrorStack";
import { useCreate } from "@/hooks/create/useCreate";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import { MobileCreateForm } from "@/components/create/mobile/MobileCreateForm";
import { useAuth } from "@hobbyist/hooks";

const SERVER_ERROR_ID = "create-server-error";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDesktop } = useDeviceType();

  // Redirect unauthenticated users away from create page.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const {
    files,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    reorderFiles,
    errors,
    removeError,
    addError,
    clearFiles,
  } = useMediaUpload();
  const {
    methods,
    serverErrorMessage,
    handleSubmit,
    isSubmitting,
    activeStep,
    handleNext,
    handleBack,
    clearServerError,
  } = useCreate();

  const allErrors = useMemo(() => {
    if (serverErrorMessage) {
      return [...errors, { id: SERVER_ERROR_ID, message: serverErrorMessage }];
    }
    return errors;
  }, [errors, serverErrorMessage]);

  const handleRemoveError = (errorId: string) => {
    if (errorId === SERVER_ERROR_ID) return clearServerError();
    removeError(errorId);
  };

  const handleClear = () => {
    methods.reset();
    clearFiles();
    clearServerError();
  };

  const preventEnterSubmit = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  // Don't render the form if user is unauthenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((data) => handleSubmit(data, files, addError))}
        onKeyDown={preventEnterSubmit}
        style={{ display: "flex", flex: 1 }}
      >
        <Stack gap={3} flex={1}>
          {isDesktop ? (
            <DesktopCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
              isSubmitting={isSubmitting}
              onClear={handleClear}
            />
          ) : (
            <MobileCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              isSubmitting={isSubmitting}
              activeStep={activeStep}
              onNext={() => handleNext(files, addError)}
              onBack={handleBack}
            />
          )}

          <ErrorStack
            errors={allErrors}
            onRemoveError={handleRemoveError}
            position={isDesktop ? "top-right" : "bottom-center"}
          />

          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
