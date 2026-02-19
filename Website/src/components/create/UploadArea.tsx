import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";

type UploadAreaProps = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive?: boolean;
  variant?: "desktop" | "mobile";
};

export function UploadArea({
  getRootProps,
  isDragActive = false,
  variant = "desktop",
}: UploadAreaProps) {
  const theme = useTheme();

  if (variant === "mobile") {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center" gap={3} padding={2}>
        <Stack gap={2} alignItems="center">
          <CameraAltOutlinedIcon sx={{ fontSize: 96, color: "text.secondary" }} />

          <Stack>
            <Typography variant="h6" textAlign="center">
              Add photos to your post
            </Typography>
            <Typography variant="body2" textAlign="center" color="text.secondary">
              Select at least one photo to showcase your item
            </Typography>
          </Stack>

          <Button variant="contained" size="large" {...getRootProps()} sx={{ width: "100%" }}>
            Choose from Gallery
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      {...getRootProps()}
      component="button"
      type="button"
      border={`2px dashed ${theme.palette.primary.main}`}
      flex={1}
      alignItems="center"
      justifyContent="center"
      borderRadius={3}
      bgcolor="transparent"
      sx={{
        "&:hover": {
          cursor: "pointer",
          border: "2px dashed white",
        },
      }}
    >
      <CameraAltOutlinedIcon sx={{ fontSize: 96, color: "text.secondary" }} />
      <Typography variant="h6" gutterBottom color="text.secondary">
        {isDragActive ? "Drop photos here" : "Add photos to your post"}
      </Typography>
      {!isDragActive && (
        <Typography variant="body2" color="text.secondary">
          Select at least one photo to showcase your item
        </Typography>
      )}
    </Stack>
  );
}
