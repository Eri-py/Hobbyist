import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";
import { UploadArea } from "@/components/create/UploadArea";
import { MediaCarousel } from "@/components/create/MediaCarousel";
import { SortableMediaStrip } from "@/components/create/desktop/SortableMediaStrip";

type DesktopMediaPanelProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
};

export function DesktopMediaPanel({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  reorderFiles,
}: DesktopMediaPanelProps) {
  const { currentIndex, setCurrentIndex, handlePrevious, handleNext, currentFile } =
    useMediaCarousel(files);

  const handleSelectFile = (fileId: string) => {
    const selectedIndex = files.findIndex((file) => file.id === fileId);
    if (selectedIndex >= 0) {
      setCurrentIndex(selectedIndex);
    }
  };

  const handleReorderFiles = (newOrder: FileWithMetadata[]) => {
    const currentFileId = currentFile?.id;
    reorderFiles(newOrder);

    if (!currentFileId) {
      return;
    }

    const nextIndex = newOrder.findIndex((file) => file.id === currentFileId);
    if (nextIndex >= 0) {
      setCurrentIndex(nextIndex);
    }
  };
  return (
    <Stack
      sx={{
        gap: 2,
      }}
    >
      <Box sx={{ width: "100%", aspectRatio: 8 / 7, minHeight: 0, display: "flex" }}>
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
      </Box>
      {files.length > 1 && (
        <SortableMediaStrip
          files={files}
          currentFileId={currentFile?.id}
          onSelectFile={handleSelectFile}
          onReorder={handleReorderFiles}
          thumbnailSize={110}
        />
      )}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          textAlign: "center",
          px: 2,
        }}
      >
        {files.length > 1
          ? "Click and hold an image or video above, then drag it to rearrange the order of your media."
          : "We recommend using high quality .jpg files less than 20 MB or .mp4 files less than 200 MB."}
      </Typography>
    </Stack>
  );
}
