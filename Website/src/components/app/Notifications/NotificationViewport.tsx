import Box from "@mui/material/Box";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import type { Notification } from "@/hooks/app/useNotifications";
import { NotificationBanner } from "./NotificationBanner";

const DESKTOP_MAX_VISIBLE = 3;
const MOBILE_MAX_VISIBLE = 1;
// When the queue is backed up on mobile, auto-hide notifications drain faster so they don't go stale.
const BACKLOG_DURATION_MS = 2000;

type NotificationViewportProps = {
  notifications: Notification[];
  onRemove: (id: string) => void;
};

/** Renders the notification queue: desktop stacks up to three top-right, mobile shows one at a time. */
export function NotificationViewport({ notifications, onRemove }: NotificationViewportProps) {
  const { isDesktop } = useDeviceType();
  const maxVisible = isDesktop ? DESKTOP_MAX_VISIBLE : MOBILE_MAX_VISIBLE;
  const visible = notifications.slice(0, maxVisible);
  const backlogged = !isDesktop && notifications.length > 1;

  if (visible.length === 0) return null;

  // Drain faster while a mobile backlog clears; sticky notifications (null) are never shortened.
  const effectiveDuration = (duration: number | null) =>
    duration !== null && backlogged ? Math.min(duration, BACKLOG_DURATION_MS) : duration;

  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: (theme) => theme.zIndex.snackbar,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        ...(isDesktop ? { top: 72, right: 16, width: 360 } : { top: 56, left: 8, right: 8 }),
      }}
    >
      {visible.map((notification) => (
        <NotificationBanner
          key={notification.id}
          notification={notification}
          isDesktop={isDesktop}
          duration={effectiveDuration(notification.duration)}
          onRemove={onRemove}
        />
      ))}
    </Box>
  );
}
