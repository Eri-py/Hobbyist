import { useCallback, useEffect, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { MediaPreview } from "@/components/shared/Media/MediaPreview";

type SortableMediaStripProps = {
  files: FileWithMetadata[];
  currentFileId?: string;
  onSelectFile: (fileId: string) => void;
  onReorder: (newOrder: FileWithMetadata[]) => void;
  thumbnailSize: number;
};

type SortableThumbnailProps = {
  file: FileWithMetadata;
  isActive: boolean;
  onSelectFile: (fileId: string) => void;
  thumbnailSize: number;
};

function SortableThumbnail({
  file,
  isActive,
  onSelectFile,
  thumbnailSize,
}: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  });

  const elementRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [isActive]);

  const mergedRef = useCallback(
    (node: HTMLButtonElement | null) => {
      setNodeRef(node);
      elementRef.current = node;
    },
    [setNodeRef],
  );

  return (
    <Box
      ref={mergedRef}
      {...attributes}
      {...listeners}
      component="button"
      type="button"
      onClick={() => onSelectFile(file.id)}
      sx={{
        width: thumbnailSize,
        height: thumbnailSize,
        p: 0,
        display: "flex",
        borderRadius: 1.5,
        overflow: "hidden",
        border: 2,
        borderColor: isActive ? "primary.main" : "divider",
        opacity: isDragging ? 0.6 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transition,
        transform: CSS.Transform.toString(transform),
        backgroundColor: "transparent",
        "& > *": { pointerEvents: "none" },
      }}
    >
      <MediaPreview fileMetadata={file} showRemoveButton={false} videoMode="thumbnail" />
    </Box>
  );
}

export function SortableMediaStrip({
  files,
  currentFileId,
  onSelectFile,
  onReorder,
  thumbnailSize,
}: SortableMediaStripProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = files.findIndex((file) => file.id === active.id);
    const newIndex = files.findIndex((file) => file.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(files, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={files.map((file) => file.id)}
        strategy={horizontalListSortingStrategy}
      >
        <Box
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "divider",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "text.disabled",
            },
            scrollbarWidth: "thin",
            scrollbarColor: (theme) => `${theme.palette.divider} transparent`,
          }}
        >
          <Stack
            direction="row"
            sx={{
              gap: 1,
              display: "inline-flex"
            }}>
            {files.map((file) => (
              <SortableThumbnail
                key={file.id}
                file={file}
                isActive={currentFileId === file.id}
                onSelectFile={onSelectFile}
                thumbnailSize={thumbnailSize}
              />
            ))}
          </Stack>
        </Box>
      </SortableContext>
    </DndContext>
  );
}
