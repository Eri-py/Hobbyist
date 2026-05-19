import { createFileRoute, useNavigate, useBlocker } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

import Stack from "@mui/material/Stack";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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

  const {
    methods,
    serverErrorMessage,
    handleSubmit,
    isSubmitting,
    activeStep,
    handleNext,
    handleBack,
    clearServerError,
    saveDraft,
    isSavingDraft,
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
  } = useMediaUpload();

  // Block navigation when the user has files loaded but hasn't posted yet.
  const blocker = useBlocker({
    shouldBlockFn: () => files.length > 0 && !isSubmitting,
    enableBeforeUnload: true,
    withResolver: true,
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveDraftAndProceed = async () => {
    setSaveError(null);
    try {
      await saveDraft(files);
      blocker.proceed?.();
    } catch {
      setSaveError("Couldn't save your draft. Discard or try again.");
    }
  };

  const handleDiscardAndProceed = () => {
    setSaveError(null);
    blocker.proceed?.();
  };

  const handleStay = () => {
    setSaveError(null);
    blocker.reset?.();
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
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

      <ConfirmDialog
        open={blocker.status === "blocked"}
        onClose={handleStay}
        icon={<BookmarkBorderOutlinedIcon />}
        iconColor="primary"
        title="Save as draft?"
        description={
          saveError ?? "You have an unsaved post. Would you like to save it as a draft to finish later?"
        }
        primaryAction={{
          label: "Save Draft",
          onClick: handleSaveDraftAndProceed,
          loading: isSavingDraft,
        }}
        secondaryAction={{
          label: "Discard",
          onClick: handleDiscardAndProceed,
        }}
      />
    </>
  );
}
