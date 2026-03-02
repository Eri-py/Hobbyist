import { type SyntheticEvent } from "react";
import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Paper from "@mui/material/Paper";

import { CreateFormHeader } from "@/components/create/CreateFormHeader";
import { CreateTips, type CreateTipKey } from "@/components/create/CreateTips";
import { DescriptionTab } from "@/components/create/mobile/DescriptionTab";
import { MediaTab } from "@/components/create/mobile/MediaTab";
import { ActionButtons } from "@/components/create/ActionButtons";

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
          {activeTab === "details" && <DescriptionTab />}
          {activeTab === "media" && (
            <MediaTab
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
            />
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
