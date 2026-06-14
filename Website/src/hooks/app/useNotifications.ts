import { createContext, useContext } from "react";

export type NotificationSeverity = "error" | "success" | "info" | "warning";

export type NotificationAction = {
  label: string;
  onClick: () => void;
};

export type NotifyOptions = {
  message: string;
  severity: NotificationSeverity;
  /** Auto-hide delay in ms; omit for default, `null` for sticky. An `action` is sticky by default. */
  duration?: number | null;
  action?: NotificationAction;
  /** A new notification with the same key replaces the existing one instead of stacking. */
  key?: string;
};

// The stored entity is the input, minus the loose duration, plus an id and a resolved duration.
export type Notification = Omit<NotifyOptions, "duration"> & {
  id: string;
  duration: number | null;
};

export type NotificationsContextTypes = {
  /** Shows a notification and returns its id. */
  notify: (options: NotifyOptions) => string;
  /** Removes a notification by id. */
  dismiss: (id: string) => void;
  //  Removes the notification carrying the given key, if any. Lets a caller clear a keyed notification
  dismissKey: (key: string) => void;
};

export const NotificationsContext = createContext<NotificationsContextTypes | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider.");
  }
  return context;
}
