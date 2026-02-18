import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/material/styles";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { MediaPreview } from "../MediaPreview";

const ImageGrid = styled(Stack)(({ theme }) => ({
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: 1,
  minHeight: 140,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
  "&::-webkit-scrollbar": {
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: 4,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.action.disabled,
    borderRadius: 4,
  },
  scrollBehavior: "smooth",
}));

type DesktopImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
};

export function DesktopImageDisplay({ files, getRootProps, removeFile }: DesktopImageDisplayProps) {
  return (
    <Stack gap={1} width="100%" overflow="hidden">
      <Typography variant="h6">
        {files.length} image{files.length !== 1 ? "s" : ""} selected
      </Typography>

      <ImageGrid
        direction="row"
        gap={2}
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY * 5;
        }}
      >
        {files.map((fileMetadata) => (
          <Paper
            key={fileMetadata.id}
            sx={{
              width: 151,
              aspectRatio: 1 / 1,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
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
      </ImageGrid>

      <Button
        {...getRootProps()}
        fullWidth
        startIcon={<AddIcon />}
        variant="contained"
        sx={{ backgroundColor: "background.paper" }}
        size="large"
      >
        Add more
      </Button>
    </Stack>
  );
}
