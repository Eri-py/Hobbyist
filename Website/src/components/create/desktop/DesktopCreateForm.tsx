import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { ActionButtons } from "@/components/create/ActionButtons";
import { FormInput, TradeOptionsFormInput } from "@/components/create/FormInputs";
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
    <Stack
      direction="row"
      sx={{
        width: "100%",
        maxWidth: 1280,
        marginX: "auto",
        padding: 2,
      }}
    >
      <Stack
        sx={{
          width: "100%",
          gap: 3,
        }}
      >
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Stack>
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
              Create post
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              Showcase your collectible.
            </Typography>
          </Stack>
          <Button variant="text" type="button" onClick={onClear}>
            Clear post
          </Button>
        </Stack>

        <Stack
          direction="row"
          sx={{
            gap: 3,
            width: "100%",
          }}
        >
          <Stack
            sx={{
              flex: 2,
              maxWidth: 500,
              gap: 1,
            }}
          >
            <Typography variant="subtitle2">Images and videos</Typography>
            <DesktopMediaPanel
              files={files}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
            />
          </Stack>

          <Stack
            sx={{
              gap: 3,
              flex: 3,
            }}
          >
            <FormInput
              field="hobby"
              label="Hobby"
              placeholder="e.g. Pokémon cards"
              size="small"
              helperText="One hobby per post."
            />

            <FormInput
              field="title"
              label="Title"
              placeholder="e.g. Mint Charizard holo, PSA 9"
              size="small"
            />

            <FormInput
              field="description"
              label="Description"
              placeholder="Describe condition, notable details, and what makes this collectible special"
              multiline
              rows={5}
              size="small"
              slotProps={{
                htmlInput: {
                  sx: {
                    resize: "vertical",
                    overflow: "auto",
                    maxHeight: 250,
                  },
                },
              }}
            />

            <TradeOptionsFormInput />

            <ActionButtons isSubmitting={isSubmitting} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
