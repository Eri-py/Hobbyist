import { createFileRoute, useNavigate, useBlocker } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";

import Stack from "@mui/material/Stack";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useCreate } from "@/hooks/create/useCreate";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import { MobileCreateForm } from "@/components/create/mobile/MobileCreateForm";
import { useAuth } from "@hobbyist/hooks";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/create")({
  head: () => seo({ title: "Create post", noindex: true }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useDeviceType();

  const hasPostedRef = useRef(false);

  const handlePostCreated = useCallback(() => {
    hasPostedRef.current = true;
    navigate({ to: user?.username ? `/profile/${user.username}` : "/profile" });
  }, [navigate, user]);

  const { methods, handleSubmit, activeStep, handleNext, handleBack, saveDraft } =
    useCreate(handlePostCreated);

  const {
    files,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    reorderFiles,
    addError,
    clearFiles,
  } = useMediaUpload();

  const blocker = useBlocker({
    shouldBlockFn: () => files.length > 0 && !hasPostedRef.current,
    enableBeforeUnload: true,
    withResolver: true,
  });

  // Fire-and-forget: dispatch the draft save, then proceed to wherever the user was headed. Failure
  // surfaces via the global notification banner, not here.
  const handleSaveDraftAndProceed = () => {
    saveDraft(files);
    blocker.proceed?.();
  };

  const handleDiscardAndProceed = () => {
    blocker.proceed?.();
  };

  const handleStay = () => {
    blocker.reset?.();
  };

  const handleClear = () => {
    methods.reset();
    clearFiles();
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
          onSubmit={methods.handleSubmit(() => handleSubmit(files, addError))}
          onKeyDown={preventEnterSubmit}
          style={{ display: "flex", flex: 1 }}
        >
          <Stack sx={{ gap: 3, flex: 1, p: isDesktop ? 0 : 1 }}>
            {isDesktop ? (
              <DesktopCreateForm
                files={files}
                getRootProps={getRootProps}
                isDragActive={isDragActive}
                removeFile={removeFile}
                reorderFiles={reorderFiles}
                onClear={handleClear}
              />
            ) : (
              <MobileCreateForm
                files={files}
                getRootProps={getRootProps}
                isDragActive={isDragActive}
                removeFile={removeFile}
                activeStep={activeStep}
                onNext={() => handleNext(files, addError)}
                onBack={handleBack}
              />
            )}

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
        description="You have an unsaved post. Would you like to save it as a draft to finish later?"
        primaryAction={{
          label: "Save Draft",
          onClick: handleSaveDraftAndProceed,
        }}
        secondaryAction={{
          label: "Discard",
          onClick: handleDiscardAndProceed,
        }}
      />
    </>
  );
}
