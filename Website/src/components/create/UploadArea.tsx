import type { DropzoneRootProps } from "react-dropzone";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

type UploadAreaProps = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive?: boolean;
};

export function UploadArea({ getRootProps, isDragActive = false }: UploadAreaProps) {
  const { isDesktop } = useDeviceType();
  return (
    <Box
      {...getRootProps()}
      component="button"
      type="button"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "transparent",
        padding: 6,
        minHeight: isDesktop ? 400 : 300,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {isDragActive ? "Drop media here" : "Drag and Drop or upload media"}
      </Typography>
    </Box>
  );
}
