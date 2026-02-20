import type { MouseEvent } from "react";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from "@mui/material/styles";

import { MediaPreview } from "./MediaPreview";
import { OverlayIconButton } from "./OverlayIconButton";

type ImageCarouselProps = {
  currentFile: FileWithMetadata;
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  onRemove: (fileId: string) => void;
  showCounter?: boolean;
  showRemoveButton?: boolean;
};

export function ImageCarousel({
  currentFile,
  currentIndex,
  totalFiles,
  onPrevious,
  onNext,
  onRemove,
  showCounter = true,
  showRemoveButton = true,
}: ImageCarouselProps) {
  const theme = useTheme();

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove(currentFile.id);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: 4 / 3,
        borderRadius: 2,
        overflow: "hidden",
        border: `2px solid ${theme.palette.divider}`,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      }}
    >
      <MediaPreview fileMetadata={currentFile} onRemove={onRemove} showRemoveButton={false} />

      {/* Navigation arrows */}
      {totalFiles > 1 && (
        <>
          <OverlayIconButton
            onClick={onPrevious}
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <ChevronLeftIcon sx={{ color: "white" }} />
          </OverlayIconButton>

          <OverlayIconButton
            onClick={onNext}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <ChevronRightIcon sx={{ color: "white" }} />
          </OverlayIconButton>
        </>
      )}

      {/* Action buttons */}
      {showCounter && (
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
            alignItems: "center",
            zIndex: 20,
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              fontSize: 12,
              color: "white",
              fontWeight: 500,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              paddingX: 1.5,
              paddingY: 0.75,
              borderRadius: 100,
            }}
          >
            {currentIndex + 1} / {totalFiles}
          </Box>
          {showRemoveButton && (
            <OverlayIconButton onClick={handleRemove} size="small">
              <DeleteIcon sx={{ color: "white" }} />
            </OverlayIconButton>
          )}
        </Box>
      )}
    </Box>
  );
}
