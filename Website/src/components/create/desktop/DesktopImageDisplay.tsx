import { useState } from "react";
import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "@mui/material/styles";

import { ImageCarousel } from "../ImageCarousel";
import { SortableImageGrid } from "./SortableImageGrid";
import { useImageCarousel } from "@/hooks/create/useImageCarousel";

type DesktopImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
};

export function DesktopImageDisplay({
  files,
  getRootProps,
  removeFile,
  reorderFiles,
}: DesktopImageDisplayProps) {
  const theme = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const { currentIndex, handlePrevious, handleNext, currentFile } = useImageCarousel(files);

  if (isEditMode) {
    return (
      <Stack gap={2} width="100%">
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            onClick={() => setIsEditMode(false)}
            size="small"
            sx={{ color: theme.palette.primary.main }}
          >
            <CheckIcon />
          </IconButton>
        </Box>

        <SortableImageGrid files={files} removeFile={removeFile} onReorder={reorderFiles} />

        <Button {...getRootProps()} fullWidth variant="outlined" size="large">
          Add more
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={2} width="100%">
      {/* Edit button */}
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <IconButton
          onClick={() => setIsEditMode(true)}
          size="small"
          sx={{ color: theme.palette.primary.main }}
        >
          <EditIcon />
        </IconButton>
      </Box>

      {/* Main image carousel */}
      <ImageCarousel
        currentFile={currentFile}
        currentIndex={currentIndex}
        totalFiles={files.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onRemove={removeFile}
        showCounter
        showRemoveButton={false}
      />

      {/* Add more button */}
      <Button {...getRootProps()} variant="outlined" size="large" fullWidth>
        Add more
      </Button>
    </Stack>
  );
}
