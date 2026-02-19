import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { MediaPreview } from "../MediaPreview";

type SortableMediaItemProps = {
  fileMetadata: FileWithMetadata;
  removeFile: (fileId: string) => void;
  sx?: SxProps<Theme>;
  orderNumber?: number;
};

export function SortableMediaItem({
  fileMetadata,
  removeFile,
  sx,
  orderNumber,
}: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fileMetadata.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        ...sx,
      }}
    >
      <MediaPreview fileMetadata={fileMetadata} onRemove={removeFile} showRemoveButton={true} />
      {orderNumber !== undefined && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {orderNumber}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
