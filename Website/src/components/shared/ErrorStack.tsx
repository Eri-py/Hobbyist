import { Stack, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { type MediaUploadError } from "@/hooks/create/useMediaUpload";

type ErrorStackPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type ErrorStackProps = {
  errors: MediaUploadError[];
  onRemoveError: (errorId: string) => void;
  position?: ErrorStackPosition;
};

export function ErrorStack({ errors, onRemoveError, position = "top-right" }: ErrorStackProps) {
  if (errors.length === 0) return null;

  const isTop = position.startsWith("top");
  const verticalPlacement = isTop ? { top: 70 } : { top: "calc(100% - 60px)" };

  const horizontalPlacement = {
    "top-left": { left: 30, transform: "translate(0, 0)" },
    "top-center": { left: "50%", transform: "translate(-50%, 0)" },
    "top-right": { left: "calc(100% - 30px)", transform: "translate(-100%, 0)" },
    "bottom-left": { left: 30, transform: "translate(0, -100%)" },
    "bottom-center": { left: "50%", transform: "translate(-50%, -100%)" },
    "bottom-right": { left: "calc(100% - 30px)", transform: "translate(-100%, -100%)" },
  }[position];

  return (
    <Stack
      sx={{
        position: "fixed",
        ...verticalPlacement,
        ...horizontalPlacement,
        gap: 1,
        zIndex: 1300,
        width: "100%",
        maxWidth: 370,
      }}
    >
      {errors.map((error) => (
        <Alert
          key={error.id}
          severity="error"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => onRemoveError(error.id)}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error.message}
        </Alert>
      ))}
    </Stack>
  );
}
