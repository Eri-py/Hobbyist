import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type ConfirmDialogAction = {
  label: string;
  onClick: () => void;
  variant?: "text" | "outlined" | "contained";
  color?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  loading?: boolean;
};

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  iconColor?: "primary" | "error" | "warning" | "success" | "info";
  title: string;
  description: string;
  primaryAction: ConfirmDialogAction;
  secondaryAction?: ConfirmDialogAction;
};

export function ConfirmDialog({
  open,
  onClose,
  icon,
  iconColor = "primary",
  title,
  description,
  primaryAction,
  secondaryAction,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            bgcolor: "background.dark",
            backgroundImage: "none",
            boxShadow: "none",
            borderRadius: 3,
            maxWidth: 450,
            flex: 1,
          },
        },
      }}
    >
      <DialogContent>
        <Stack sx={{ alignItems: "center", gap: 2, pt: 1 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: (theme) => alpha(theme.palette[iconColor].main, 0.15),
              color: `${iconColor}.main`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& svg": { fontSize: 28 },
            }}
          >
            {icon}
          </Box>

          <Stack sx={{ alignItems: "center", gap: 0.75 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }}>
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 280, textAlign: "center" }}
            >
              {description}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: "center" }}>
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant={secondaryAction.variant ?? "outlined"}
            color={secondaryAction.color ?? "inherit"}
            sx={{ flex: 1 }}
          >
            {secondaryAction.label}
          </Button>
        )}
        <Button
          onClick={primaryAction.onClick}
          variant={primaryAction.variant ?? "contained"}
          color={primaryAction.color ?? "primary"}
          loading={primaryAction.loading}
          sx={{ flex: 1 }}
        >
          {primaryAction.label}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
