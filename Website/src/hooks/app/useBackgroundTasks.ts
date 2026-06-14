import { createContext, useContext } from "react";

export type BackgroundTask = {
  id: string;
  label?: string;
  startedAt: number;
};

export type BackgroundTasksContextTypes = {
  /** Tasks currently in flight. Drives the beforeunload guard. */
  pending: BackgroundTask[];
  hasPending: boolean;
  /**
   * Runs a fire-and-forget task: guarded by beforeunload while in flight, and on failure surfaces a
   * notification with a Retry action. Never rejects (safe to `void`) — resolves to the value or undefined.
   */
  run: <T>(task: () => Promise<T>, meta?: { label?: string }) => Promise<T | undefined>;
};

export const BackgroundTasksContext = createContext<BackgroundTasksContextTypes | null>(null);

export function useBackgroundTasks() {
  const context = useContext(BackgroundTasksContext);
  if (!context) {
    throw new Error("useBackgroundTasks must be used within a BackgroundTasksProvider.");
  }
  return context;
}
