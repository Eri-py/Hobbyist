import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { ImageCarousel } from "../ImageCarousel";
import { useImageCarousel } from "@/hooks/create/useImageCarousel";

type MobileImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
};

export function MobileImageDisplay({ files, getRootProps, removeFile }: MobileImageDisplayProps) {
  const { currentIndex, handlePrevious, handleNext, currentFile } = useImageCarousel(files);

  return (
    <Stack gap={2} flex={1}>
      {/* Main image carousel */}
      <ImageCarousel
        currentFile={currentFile}
        currentIndex={currentIndex}
        totalFiles={files.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onRemove={removeFile}
        showCounter
      />

      {/* Add more button */}
      <Button {...getRootProps()} variant="outlined" size="large" fullWidth>
        Add more photos
      </Button>
    </Stack>
  );
}
