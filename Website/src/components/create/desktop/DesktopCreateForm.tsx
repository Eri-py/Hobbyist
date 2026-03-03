import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { ActionButtons } from "@/components/create/ActionButtons";
import { CreateFormHeader } from "@/components/create/CreateFormHeader";
import {
  DescriptionFormInput,
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
};

export function DesktopCreateForm({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  reorderFiles,
  isSubmitting,
}: DesktopCreateFormProps) {
  return (
    <Stack direction="row" width="100%" maxWidth={1280} marginX="auto" padding={2}>
      <Stack width="100%" gap={3}>
        <CreateFormHeader
          rightAction={
            <Button variant="text" type="button">
              Clear post
            </Button>
          }
        />

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
            <TitleFormInput label="Title" placeholder="e.g. Mint Charizard holo, PSA 9" />

            <DescriptionFormInput
              label="Description"
              placeholder="Describe condition, notable details, and what makes this collectible special"
              rows={5}
            />

            <TradeOptionsFormInput />

            <ActionButtons isSubmitting={isSubmitting} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
