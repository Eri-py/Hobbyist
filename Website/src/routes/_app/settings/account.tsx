import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

export const Route = createFileRoute("/_app/settings/account")({
  component: AccountSettings,
});

// Label + control + helper text, shown inline (Instagram-style).
function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      {children}
      {helper && (
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.75 }}>{helper}</Typography>
      )}
    </Box>
  );
}

// Password input with a self-contained show/hide toggle.
function PasswordField({ label, placeholder }: { label: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        type={show ? "text" : "password"}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShow((v) => !v)}
                  edge="end"
                  size="small"
                  aria-label="toggle password visibility"
                >
                  {show ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Field>
  );
}

function AccountSettings() {
  const { isDesktop } = useDeviceType();

  return (
    <Stack sx={{ p: isDesktop ? 4 : 2, gap: 4, maxWidth: 640, width: "100%", mx: "auto" }}>
      {isDesktop && <Typography sx={{ fontSize: 28, fontWeight: 700 }}>Account</Typography>}

      <Stack sx={{ gap: 2.5 }}>
        <Field label="Email" helper="Used for signing in and account notifications.">
          <TextField fullWidth size="small" placeholder="you@example.com" />
        </Field>
        <Field label="Username" helper="Your unique handle — also your profile URL.">
          <TextField fullWidth size="small" placeholder="your_username" />
        </Field>
        <Box>
          <Button variant="contained">Save changes</Button>
        </Box>
      </Stack>

      <Divider />

      <Stack sx={{ gap: 2.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Change password</Typography>
        <PasswordField label="Current password" placeholder="Enter your current password" />
        <PasswordField label="New password" placeholder="New password" />
        <PasswordField label="Confirm new password" placeholder="Confirm new password" />
        <Box>
          <Button variant="contained">Update password</Button>
        </Box>
      </Stack>

      <Divider />

      <Stack sx={{ gap: 1.5 }}>
        <Button variant="outlined" color="inherit" fullWidth>
          Log out
        </Button>
        <Button variant="outlined" color="error" fullWidth startIcon={<DeleteOutlinedIcon />}>
          Delete account
        </Button>
      </Stack>
    </Stack>
  );
}
