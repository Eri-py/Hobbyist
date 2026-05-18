import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useCallback, useEffect } from "react";
import type { KeyboardEvent } from "react";

import Stack from "@mui/material/Stack";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { ErrorStack } from "@/components/shared/ErrorStack";
import { useCreate } from "@/hooks/create/useCreate";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import { MobileCreateForm } from "@/components/create/mobile/MobileCreateForm";
import { useAuth } from "@hobbyist/hooks";


export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useDeviceType();

  // Redirect unauthenticated users away from the create page.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handlePostCreated = useCallback(
    (postId: string) => {
      if (user?.username) {
        navigate({ to: `/profile/${user.username}/${postId}` });
        return;
      }
      navigate({ to: "/profile" });
    },
    [navigate, user],
  );

  // useCreate must be initialised first so its callbacks can be forwarded to
  // useMediaUpload, which needs them at construction time.
  const {
    methods,
    serverErrorMessage,
    handleSubmit,
    isSubmitting,
    isUploadingMedia,
    activeStep,
    handleNext,
    handleBack,
    clearServerError,
    onFilesAdded,
    onFileRemoved,
    discardDraft,
  } = useCreate(handlePostCreated);

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
  } = useMediaUpload({ onFilesAdded, onFileRemoved });

  const handleClear = () => {
    discardDraft();
    methods.reset();
    clearFiles();
    clearServerError();
  };

  const preventEnterSubmit = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

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
        <Stack sx={{ gap: 3, flex: 1 }}>
          {isDesktop ? (
            <DesktopCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
              isSubmitting={isSubmitting}
              isUploadingMedia={isUploadingMedia}
              onClear={handleClear}
            />
          ) : (
            <MobileCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              isSubmitting={isSubmitting}
              isUploadingMedia={isUploadingMedia}
              activeStep={activeStep}
              onNext={() => handleNext(files, addError)}
              onBack={handleBack}
            />
          )}

          <ErrorStack
            errors={errors}
            onRemoveError={removeError}
            serverError={serverErrorMessage}
            onClearServerError={clearServerError}
            position={isDesktop ? "top-right" : "bottom-center"}
          />

          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
