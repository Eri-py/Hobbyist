import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";

import { SortableMediaItem } from "@/components/create/desktop/SortableMediaItem";

const ImageGrid = styled(Stack)(({ theme }) => ({
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: 12,
  minHeight: 300,
  cursor: "grab",
  overscrollBehavior: "contain",
  "&:active": {
    cursor: "grabbing",
  },
  "&::-webkit-scrollbar": {
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: 4,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.action.disabled,
    borderRadius: 4,
  },
  scrollBehavior: "smooth",
}));

type SortableImageGridProps = {
  files: FileWithMetadata[];
  removeFile: (fileId: string) => void;
  onReorder: (newOrder: FileWithMetadata[]) => void;
};

export function SortableImageGrid({ files, removeFile, onReorder }: SortableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((file) => file.id === active.id);
      const newIndex = files.findIndex((file) => file.id === over.id);

      const newOrder = arrayMove(files, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={files} strategy={horizontalListSortingStrategy}>
        <ImageGrid
          direction="row"
          gap={2}
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY * 5;
          }}
        >
          {files.map((fileMetadata) => (
            <SortableMediaItem
              key={fileMetadata.id}
              fileMetadata={fileMetadata}
              removeFile={removeFile}
              sx={{
                maxWidth: 300,
                aspectRatio: 1 / 1,
                flexShrink: 0,
              }}
            />
          ))}
        </ImageGrid>
      </SortableContext>
    </DndContext>
  );
}
