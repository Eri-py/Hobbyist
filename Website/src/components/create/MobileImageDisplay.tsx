import type { DropzoneRootProps } from "react-dropzone";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

type MobileImageDisplayProps = {
  files: File[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
};

export function MobileImageDisplay({ files, getRootProps }: MobileImageDisplayProps) {
  return (
    <Stack gap={2} flex={1}>
      <Typography variant="h6" textAlign="center">
        {files.length} photo{files.length !== 1 ? "s" : ""} selected
      </Typography>

      {/* Large Cover Photo */}
      <Paper
        sx={{
          width: "100%",
          aspectRatio: 4 / 3,
          borderRadius: 2,
          overflow: "hidden",
          border: 2,
          borderColor: "primary.main",
          position: "relative",
        }}
      >
        <img
          src={URL.createObjectURL(files[0])}
          alt={files[0].name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            padding: "4px 8px",
            borderRadius: 1,
            fontWeight: "bold",
          }}
        >
          Cover Photo
        </Typography>
      </Paper>

      {/* Remaining photos in pairs */}
      {files.length > 1 && (
        <Stack
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
          }}
        >
          {files.slice(1).map((file) => (
            <Paper
              key={file.name}
              sx={{
                aspectRatio: 1,
                borderRadius: 2,
                overflow: "hidden",
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
        </Stack>
      )}

      <Button {...getRootProps()} startIcon={<AddIcon />} variant="outlined" size="large">
        Add more photos
      </Button>
    </Stack>
  );
}
