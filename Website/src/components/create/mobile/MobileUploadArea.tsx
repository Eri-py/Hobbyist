import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";

type MobileUploadAreaProps = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
};

export function MobileUploadArea({ getRootProps }: MobileUploadAreaProps) {
  return (
    <Stack flex={1} justifyContent="center" alignItems="center" gap={3} padding={2}>
      <Stack gap={1} alignItems="center">
        <CameraAltOutlinedIcon sx={{ fontSize: 96, color: "text.secondary" }} />
        <Typography variant="h6" textAlign="center">
          Add photos to your post
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Select at least one photo to showcase your item
        </Typography>
      </Stack>

      <Stack gap={2} width="100%" maxWidth={250}>
        <Button variant="contained" size="large" {...getRootProps()}>
          Choose from Gallery
        </Button>
        <Button variant="outlined" size="large">
          Take Photo
        </Button>
      </Stack>
    </Stack>
  );
}
