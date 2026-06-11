import { createContext, useContext } from "react";

export type NotificationSeverity = "error" | "success" | "info" | "warning";

export type NotificationAction = {
  label: string;
  onClick: () => void;
};

export type NotifyOptions = {
  message: string;
  severity: NotificationSeverity;
  /**
   * Auto-hide delay in ms. Omit for a sensible default; pass `null` to make it sticky (stays until
   * dismissed). A notification with an `action` is sticky by default so it can't vanish before the
   * user acts.
   */
  duration?: number | null;
  action?: NotificationAction;
  /**
   * When set, a new notification with the same key replaces the existing one instead of stacking.
   * Use for repeatable events (e.g. a login that keeps failing) so they don't pile up.
   */
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
};

export const NotificationsContext = createContext<NotificationsContextTypes | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider.");
  }
  return context;
}
