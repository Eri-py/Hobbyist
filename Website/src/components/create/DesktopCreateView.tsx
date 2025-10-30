import type { DropzoneRootProps } from "react-dropzone";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import { DesktopUploadArea } from "./DesktopUploadArea";
import { DesktopImageDisplay } from "./DesktopImageDisplay";

type DesktopCreateViewProps = {
  files: File[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
};

export function DesktopCreateView({ files, getRootProps, isDragActive }: DesktopCreateViewProps) {
  return (
    <Stack alignItems="center">
      <Paper
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 700,
          aspectRatio: 2 / 1,
          borderRadius: 3,
          padding: files.length > 0 ? 3 : 0,
        }}
      >
        {files.length > 0 ? (
          <DesktopImageDisplay files={files} getRootProps={getRootProps} />
        ) : (
          <DesktopUploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
        )}
      </Paper>
    </Stack>
  );
}
