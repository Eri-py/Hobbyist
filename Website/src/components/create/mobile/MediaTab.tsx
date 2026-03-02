import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";

import { MediaCarousel } from "@/components/create/mobile/MediaCarousel";
import { UploadArea } from "@/components/create/UploadArea";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";

type MediaTabProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
};

export function MediaTab({ files, getRootProps, isDragActive, removeFile }: MediaTabProps) {
  const { currentIndex, handlePrevious, handleNext, currentFile } = useMediaCarousel(files);

  return (
    <Stack gap={3}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          minHeight: 250,
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        }}
      >
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
      </Paper>
    </Stack>
  );
}
