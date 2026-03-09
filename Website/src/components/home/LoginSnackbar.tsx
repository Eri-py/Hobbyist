import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

export function LoginSnackbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { isDesktop } = useDeviceType();

  const handleClose = (_: SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={null}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      style={{ marginBottom: 64, width: isDesktop ? "100%" : undefined, maxWidth: 600 }}
    >
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          paddingBlock: 1,
          paddingInline: 2,
          flex: 1,
        }}
      >
        <Typography variant="body2" sx={{ flex: 1 }}>
          Login to interact with posts
        </Typography>
        <Button variant="text" onClick={handleLoginClick}>
          Login
        </Button>
        <IconButton aria-label="close" color="inherit" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Snackbar>
  );
}
