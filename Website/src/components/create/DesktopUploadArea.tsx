import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import type { DropzoneRootProps } from "react-dropzone";
import { useTheme } from "@mui/material/styles";

type DesktopUploadAreaProps = {
  getRootProps: () => DropzoneRootProps;
  isDragActive: boolean;
};

export function DesktopUploadArea({ getRootProps, isDragActive }: DesktopUploadAreaProps) {
  const theme = useTheme();
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
      bgcolor="background.paper"
      sx={{
        "&:hover": {
          cursor: "pointer",
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <CameraAltOutlinedIcon sx={{ fontSize: 96, color: "text.secondary" }} />
      <Typography variant="h6" gutterBottom>
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
