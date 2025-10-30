import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/material/styles";

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
  files: File[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
};

export function DesktopImageDisplay({ files, getRootProps }: DesktopImageDisplayProps) {
  return (
    <Stack gap={1} overflow="hidden">
      <Typography variant="h6">
        {files.length} image{files.length !== 1 ? "s" : ""} selected
      </Typography>

      <ImageGrid
        direction="row"
        gap={2}
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY * 5;
        }}
      >
        {files.map((file) => (
          <Paper
            key={file.name}
            sx={{
              width: 200,
              height: 200,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Paper>
        ))}
      </ImageGrid>

      <Button
        {...getRootProps()}
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
