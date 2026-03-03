import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { OverlayIconButton } from "./OverlayIconButton";
import { VideoPlayer } from "./VideoPlayer";

type MediaPreviewTypes = {
  fileMetadata: FileWithMetadata;
  onRemove?: (fileId: string) => void;
  showRemoveButton?: boolean;
  videoMode?: "interactive" | "thumbnail";
};

export function MediaPreview({
  fileMetadata,
  onRemove,
  showRemoveButton = false,
  videoMode = "interactive",
}: MediaPreviewTypes) {
  const isImage = fileMetadata.file.type.startsWith("image/");

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(fileMetadata.id);
  };

  if (isImage) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={fileMetadata.preview}
          alt={fileMetadata.file.name}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
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
            <CloseIcon fontSize="small" sx={{ color: "white" }} />
          </OverlayIconButton>
        )}
      </Box>
    );
  }

  if (videoMode === "thumbnail") {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
        }}
      >
        <video
          src={fileMetadata.preview}
          muted
          playsInline
          preload="metadata"
          controls={false}
          onLoadedData={(event) => {
            event.currentTarget.currentTime = 0.01;
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
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
