import { createFileRoute } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useState, useMemo, type SyntheticEvent } from "react";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { ErrorStack } from "@/components/shared/ErrorStack";
import { useCreate } from "@/hooks/create/useCreate";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { DesktopCreateForm } from "@/components/create/desktop/DesktopCreateForm";
import {
  MobileCreateForm,
  type MobileCreateTab,
} from "@/components/create/mobile/MobileCreateForm";
// import { CommunitySelector } from "@/components/create/CommunitySelector";

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
  const [activeTab, setActiveTab] = useState<MobileCreateTab>("details");
  // const [selectedCommunity, setSelectedCommunity] = useState<string>("Select a community");
  const { methods, serverErrorMessage, handleSubmit, isSubmitting } = useCreate();

  const allErrors = useMemo(() => {
    if (serverErrorMessage) {
      return [
        ...errors,
        {
          id: `server-${serverErrorMessage}`,
          message: serverErrorMessage,
        },
      ];
    }
    return errors;
  }, [errors, serverErrorMessage]);

  const handleTabChange = (_: SyntheticEvent, newValue: MobileCreateTab) => {
    setActiveTab(newValue);
  };

  const draftsButton = useMemo(
    () => (
      <Button variant="text" onClick={() => {}}>
        Drafts
      </Button>
    ),
    [],
  );

  // Configure mobile header
  useMobileHeaderConfig({
    right: draftsButton,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(() => handleSubmit(files))}
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
            />
          ) : (
            <MobileCreateForm
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              isSubmitting={isSubmitting}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}

          <ErrorStack
            errors={allErrors}
            onRemoveError={removeError}
            position={isDesktop ? "top-right" : "bottom-center"}
          />

          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
