import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { ActionButtons } from "@/components/create/ActionButtons";
import {
  DescriptionFormInput,
  HobbyFormInput,
  TitleFormInput,
  TradeOptionsFormInput,
} from "@/components/create/FormInputs";
import { DesktopMediaPanel } from "@/components/create/desktop/DesktopMediaPanel";

type DesktopCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
  isSubmitting: boolean;
  onClear: () => void;
};

export function DesktopCreateForm({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  reorderFiles,
  isSubmitting,
  onClear,
}: DesktopCreateFormProps) {
  return (
    <Stack direction="row" width="100%" maxWidth={1280} marginX="auto" padding={2}>
      <Stack width="100%" gap={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack>
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
              Create post
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showcase your collectible.
            </Typography>
          </Stack>
          <Button variant="text" type="button" onClick={onClear}>
            Clear post
          </Button>
        </Stack>

        <Stack direction="row" gap={3} width="100%">
          <Stack flex={2} maxWidth={500} gap={1}>
            <Typography variant="subtitle2">Images and videos</Typography>
            <DesktopMediaPanel
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
            />
          </Stack>

          <Stack gap={3} flex={3}>
            <HobbyFormInput />

            <TitleFormInput />

            <DescriptionFormInput rows={5} />

            <TradeOptionsFormInput />

            <ActionButtons isSubmitting={isSubmitting} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
