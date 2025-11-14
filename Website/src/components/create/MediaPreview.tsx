import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { OverlayIconButton } from "./OverlayIconButton";
import { VideoPlayer } from "./VideoPlayer";

type MediaPreviewTypes = {
  fileMetadata: FileWithMetadata;
  onRemove?: (fileId: string) => void;
  showRemoveButton?: boolean;
};

export function MediaPreview({
  fileMetadata,
  onRemove,
  showRemoveButton = false,
}: MediaPreviewTypes) {
  const isImage = fileMetadata.file.type.startsWith("image/");

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(fileMetadata.id);
  };

  if (isImage) {
    return (
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        <img
          src={fileMetadata.preview}
          alt={fileMetadata.file.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
        {showRemoveButton && onRemove && (
          <OverlayIconButton
            onClick={handleRemove}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </OverlayIconButton>
        )}
      </Box>
    );
  }

  return (
    <VideoPlayer
      src={fileMetadata.preview}
      onRemove={onRemove ? () => onRemove(fileMetadata.id) : undefined}
      showRemoveButton={showRemoveButton}
    />
  );
}
