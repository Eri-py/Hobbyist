import type { MouseEvent } from "react";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import type { DropzoneRootProps } from "react-dropzone";

import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from "@mui/material/styles";

import { OverlayIconButton } from "@/components/shared/Media/OverlayIconButton";
import { MediaPreview } from "@/components/shared/Media/MediaPreview";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

type MediaCarouselProps = {
  currentFile: FileWithMetadata;
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  onRemove: (fileId: string) => void;
  getRootProps?: <T extends DropzoneRootProps>(props?: T) => T;
  showCounter?: boolean;
  showRemoveButton?: boolean;
  showEditButton?: boolean;
  isEditMode?: boolean;
  onEditToggle?: () => void;
};

export function MediaCarousel({
  currentFile,
  currentIndex,
  totalFiles,
  onPrevious,
  onNext,
  onRemove,
  getRootProps,
  showCounter = true,
  showRemoveButton = true,
  showEditButton = false,
  isEditMode = false,
  onEditToggle,
}: MediaCarouselProps) {
  const theme = useTheme();
  const { isDesktop } = useDeviceType();

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove(currentFile.id);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: isDesktop ? 5 / 4 : 8 / 7,
        borderRadius: 2,
        overflow: "hidden",
        border: `2px solid ${theme.palette.divider}`,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      }}
    >
      <MediaPreview fileMetadata={currentFile} onRemove={onRemove} showRemoveButton={false} />

      {/* Edit/Check button */}
      {showEditButton && onEditToggle && (
        <OverlayIconButton
          onClick={onEditToggle}
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
          }}
          size="small"
        >
          {isEditMode ? (
            <CheckIcon sx={{ color: "white" }} />
          ) : (
            <EditIcon sx={{ color: "white" }} />
          )}
        </OverlayIconButton>
      )}

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
          {getRootProps && (
            <OverlayIconButton {...getRootProps()} size="small">
              <AddIcon sx={{ color: "white" }} />
            </OverlayIconButton>
          )}
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
