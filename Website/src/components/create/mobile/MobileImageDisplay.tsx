import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

import { SortableMediaItem } from "../SortableMediaItem";

type MobileImageDisplayProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
};

export function MobileImageDisplay({
  files,
  getRootProps,
  removeFile,
  reorderFiles,
}: MobileImageDisplayProps) {
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
    <Stack gap={2} flex={1}>
      <Typography variant="h6" textAlign="center">
        {files.length} photo{files.length !== 1 ? "s" : ""} selected
      </Typography>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={files} strategy={rectSortingStrategy}>
          <Stack gap={2}>
            <SortableMediaItem
              fileMetadata={files[0]}
              removeFile={removeFile}
              orderNumber={1}
              sx={{
                width: "100%",
                aspectRatio: 4 / 3,
                border: 2,
                borderColor: "primary.main",
              }}
            />

            {files.length > 1 && (
              <Stack
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  rowGap: 2,
                  columnGap: 3,
                }}
              >
                {files.slice(1).map((fileMetadata, index) => (
                  <SortableMediaItem
                    key={fileMetadata.id}
                    fileMetadata={fileMetadata}
                    removeFile={removeFile}
                    orderNumber={index + 2}
                    sx={{
                      width: "100%",
                      aspectRatio: 1,
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </SortableContext>
      </DndContext>

      <Button {...getRootProps()} startIcon={<AddIcon />} variant="outlined" size="large">
        Add more photos
      </Button>
    </Stack>
  );
}
