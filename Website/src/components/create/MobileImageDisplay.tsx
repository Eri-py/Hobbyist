import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { MediaPreview } from "./MediaPreview";

type MobileImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
};

export function MobileImageDisplay({ files, getRootProps, removeFile }: MobileImageDisplayProps) {
  return (
    <Stack gap={2} flex={1}>
      <Typography variant="h6" textAlign="center">
        {files.length} photo{files.length !== 1 ? "s" : ""} selected
      </Typography>

      {/* Large Cover Photo */}
      <Paper
        sx={{
          width: "100%",
          aspectRatio: 4 / 3,
          borderRadius: 2,
          overflow: "hidden",
          border: 2,
          borderColor: "primary.main",
          position: "relative",
        }}
      >
        <MediaPreview fileMetadata={files[0]} onRemove={removeFile} showRemoveButton={true} />
      </Paper>

      {/* Remaining photos in pairs */}
      {files.length > 1 && (
        <Stack
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
          }}
        >
          {files.slice(1).map((fileMetadata) => (
            <Paper
              key={fileMetadata.id}
              sx={{
                aspectRatio: 1,
                borderRadius: 2,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <MediaPreview
                fileMetadata={fileMetadata}
                onRemove={removeFile}
                showRemoveButton={true}
              />
            </Paper>
          ))}
        </Stack>
      )}

      <Button {...getRootProps()} startIcon={<AddIcon />} variant="outlined" size="large">
        Add more photos
      </Button>
    </Stack>
  );
}
