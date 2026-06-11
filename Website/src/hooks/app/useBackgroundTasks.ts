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
   * Runs a fire-and-forget task: registers it so the beforeunload guard can warn while it's in
   * flight, and surfaces a notification if it ultimately fails. The task is expected to handle its
   * own retries — reaching a rejection here means it gave up. `run` never rejects (it swallows
   * after notifying), so callers can safely `void` it; it resolves to the task's value on success
   * or `undefined` on failure.
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
