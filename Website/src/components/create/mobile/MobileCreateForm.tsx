import { type SyntheticEvent } from "react";
import type { DropzoneRootProps } from "react-dropzone";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

import { CreateFormHeader } from "@/components/create/CreateFormHeader";
import { CreateTips, type CreateTipKey } from "@/components/create/CreateTips";
import { ActionButtons } from "@/components/create/ActionButtons";
import { DescriptionFormInput, TitleFormInput } from "@/components/create/FormInputs";
import { MediaCarousel } from "@/components/create/MediaCarousel";
import { UploadArea } from "@/components/create/UploadArea";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";

export type MobileCreateTab = CreateTipKey;

type MobileCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  isSubmitting: boolean;
  activeTab: MobileCreateTab;
  onTabChange: (_: SyntheticEvent, newValue: MobileCreateTab) => void;
};

export function MobileCreateForm({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  isSubmitting,
  activeTab,
  onTabChange,
}: MobileCreateFormProps) {
  const { currentIndex, handlePrevious, handleNext, currentFile } = useMediaCarousel(files);

  return (
    <Stack
      width="100%"
      maxWidth={1500}
      direction="column"
      marginX="auto"
      paddingBottom={18}
      alignItems="flex-start"
    >
      <Stack gap={3} width="100%" minWidth={0}>
        <CreateFormHeader />

        <Tabs value={activeTab} onChange={onTabChange}>
          <Tab label="Details" value="details" />
          <Tab label="Images & Videos" value="media" />
          <Tab label="Preview" value="preview" />
        </Tabs>

        <Stack gap={3}>
          {activeTab === "details" && (
            <Stack gap={3}>
              <TitleFormInput placeholder="Title" />

              <DescriptionFormInput placeholder="Description" rows={7} />
            </Stack>
          )}

          {activeTab === "media" && (
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "transparent",
              }}
            >
              <Box sx={{ width: "100%", aspectRatio: "8 / 7", minHeight: 250, display: "flex" }}>
                {files.length > 0 ? (
                  <MediaCarousel
                    currentFile={currentFile}
                    currentIndex={currentIndex}
                    totalFiles={files.length}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onRemove={removeFile}
                    getRootProps={getRootProps}
                    showCounter
                  />
                ) : (
                  <UploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
                )}
              </Box>
            </Paper>
          )}

          {activeTab === "preview" && <div />}
        </Stack>

        <ActionButtons isSubmitting={isSubmitting} />

        <Paper
          component="footer"
          sx={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 60,
            zIndex: 10,
            p: 2,
            borderRadius: 2,
          }}
        >
          <CreateTips activeTip={activeTab} />
        </Paper>
      </Stack>
    </Stack>
  );
}
