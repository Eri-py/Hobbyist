import type { DropzoneRootProps } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/material/styles";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { SortableMediaItem } from "../SortableMediaItem";

const ImageGrid = styled(Stack)(({ theme }) => ({
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: 1,
  minHeight: 140,
  cursor: "grab",
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

type DesktopImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
};

export function DesktopImageDisplay({
  files,
  getRootProps,
  removeFile,
  reorderFiles,
}: DesktopImageDisplayProps) {
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
      reorderFiles(newOrder);
    }
  };

  return (
    <Stack gap={1} width="100%" overflow="hidden">
      <Typography variant="h6">
        {files.length} image{files.length !== 1 ? "s" : ""} selected
      </Typography>

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
                  width: 151,
                  aspectRatio: 1 / 1,
                  flexShrink: 0,
                }}
              />
            ))}
          </ImageGrid>
        </SortableContext>
      </DndContext>

      <Button
        {...getRootProps()}
        fullWidth
        startIcon={<AddIcon />}
        variant="contained"
        sx={{ backgroundColor: "background.paper" }}
        size="large"
      >
        Add more
      </Button>
    </Stack>
  );
}
