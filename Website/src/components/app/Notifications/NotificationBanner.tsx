import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";

import type { Notification } from "@/hooks/app/useNotifications";

type NotificationBannerProps = {
  notification: Notification;
  isDesktop: boolean;
  duration: number | null;
  onRemove: (id: string) => void;
};

export function NotificationBanner({
  notification,
  isDesktop,
  duration,
  onRemove,
}: NotificationBannerProps) {
  const [open, setOpen] = useState(true);
  const close = useCallback(() => setOpen(false), []);

  // Auto-hide after the (possibly shortened) duration; sticky notifications pass null and stay put.
  useEffect(() => {
    if (duration === null) return;
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  }, [duration, close]);

  const { action } = notification;

  return (
    <Slide
      direction={isDesktop ? "left" : "down"}
      in={open}
      appear
      mountOnEnter
      unmountOnExit
      onExited={() => onRemove(notification.id)}
    >
      <Alert
        severity={notification.severity}
        sx={(theme) => {
          const accent =
            notification.severity === "info"
              ? theme.palette.primary.main
              : theme.palette[notification.severity].main;
          return {
            width: "100%",
            maxHeight: 70,
            alignItems: "center",
            borderRadius: 2,
            boxShadow: 6,
            py: 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: `4px solid ${accent}`,
            "& .MuiAlert-icon": { alignItems: "center" },
            "& .MuiAlert-icon .MuiSvgIcon-root": {
              color: accent,
              fontSize: 24,
            },
            "& .MuiAlert-message": { fontSize: 16 },
          };
        }}
        action={
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            {action && (
              <Button
                color="inherit"
                size="large"
                sx={{ fontWeight: 700 }}
                onClick={() => {
                  action.onClick();
                  close();
                }}
              >
                {action.label}
              </Button>
            )}
            <IconButton aria-label="Close" color="inherit" size="small" onClick={close}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {notification.message}
      </Alert>
    </Slide>
  );
}
