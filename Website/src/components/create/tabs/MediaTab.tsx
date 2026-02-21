import type { DropzoneRootProps } from "react-dropzone";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

import { MediaDisplay } from "../MediaDisplay";
import { UploadArea } from "../UploadArea";

type MediaTabProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
};

export function MediaTab({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  reorderFiles,
}: MediaTabProps) {
  const theme = useTheme();
  const isDesktopView = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Stack gap={2}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          minHeight: isDesktopView ? 400 : 300,
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        }}
      >
        {files.length > 0 ? (
          <Box sx={{ p: 2, flex: 1 }}>
            <MediaDisplay
              files={files}
              getRootProps={getRootProps}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
            />
          </Box>
        ) : (
          <UploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
        )}
      </Paper>
    </Stack>
  );
}
