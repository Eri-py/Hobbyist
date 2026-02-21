import { useState } from "react";
import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "@mui/material/styles";

import { MediaCarousel } from "./MediaCarousel";
import { SortableImageGrid } from "./SortableImageGrid";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

type MediaDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
  reorderFiles?: (newOrder: FileWithMetadata[]) => void;
};

export function MediaDisplay({ files, getRootProps, removeFile, reorderFiles }: MediaDisplayProps) {
  const theme = useTheme();
  const { isDesktop } = useDeviceType();
  const [isEditMode, setIsEditMode] = useState(false);
  const { currentIndex, handlePrevious, handleNext, currentFile } = useMediaCarousel(files);

  // Mobile layout
  if (!isDesktop) {
    return (
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
    );
  }

  // Desktop layout
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

        <SortableImageGrid
          files={files}
          removeFile={removeFile}
          onReorder={reorderFiles || (() => {})}
        />
      </Stack>
    );
  }

  return (
    <MediaCarousel
      currentFile={currentFile}
      currentIndex={currentIndex}
      totalFiles={files.length}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onRemove={removeFile}
      getRootProps={getRootProps}
      showCounter
      showRemoveButton={false}
      showEditButton
      isEditMode={isEditMode}
      onEditToggle={() => setIsEditMode(!isEditMode)}
    />
  );
}
