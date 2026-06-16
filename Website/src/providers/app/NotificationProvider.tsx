import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  NotificationsContext,
  type Notification,
  type NotificationsContextTypes,
  type NotifyOptions,
} from "@/hooks/app/useNotifications";
import { NotificationViewport } from "@/components/app/Notifications/NotificationViewport";

const DEFAULT_DURATION_MS = 6000;

let notificationCounter = 0;
const nextNotificationId = () => `notification-${(notificationCounter += 1)}`;

// Auto-hide unless told otherwise: an explicit duration (including null for sticky) wins; an action
// makes it sticky so it can't vanish before the user acts; everything else gets the default.
function resolveDuration(options: NotifyOptions): number | null {
  if (options.duration !== undefined) return options.duration;
  if (options.action) return null;
  return DEFAULT_DURATION_MS;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((options: NotifyOptions): string => {
    const id = nextNotificationId();
    const entry: Notification = {
      id,
      message: options.message,
      severity: options.severity,
      duration: resolveDuration(options),
      action: options.action,
      key: options.key,
    };

    setNotifications((prev) => {
      if (options.key) {
        const index = prev.findIndex((n) => n.key === options.key);
        if (index >= 0) {
          // Replace in place so a repeated event refreshes rather than stacks.
          const next = [...prev];
          next[index] = entry;
          return next;
        }
      }
      return [...prev, entry];
    });

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissKey = useCallback((key: string) => {
    setNotifications((prev) => prev.filter((n) => n.key !== key));
  }, []);

  // Only notify/dismiss go through context (stable), so consumers don't re-render as the list
  // changes — the viewport owns the list.
  const value: NotificationsContextTypes = useMemo(
    () => ({ notify, dismiss, dismissKey }),
    [notify, dismiss, dismissKey],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationViewport notifications={notifications} onRemove={dismiss} />
    </NotificationsContext.Provider>
  );
}
