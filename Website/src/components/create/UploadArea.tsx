import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

type UploadAreaProps = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
};

export function UploadArea({ getRootProps, isDragActive }: UploadAreaProps) {
  return (
    <Stack
      {...getRootProps()}
      component="button"
      type="button"
      flex={1}
      alignItems="center"
      justifyContent="center"
      border="2px dashed"
      borderColor="divider"
      borderRadius={2}
      bgcolor="transparent"
      sx={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: "text.secondary" }} />
      <Typography variant="body1" color="text.secondary">
        {isDragActive ? "Drop media here" : "Drag and Drop or upload media"}
      </Typography>
    </Stack>
  );
}
