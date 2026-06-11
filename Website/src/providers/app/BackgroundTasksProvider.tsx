import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BackgroundTasksContext,
  type BackgroundTask,
  type BackgroundTasksContextTypes,
} from "@/hooks/app/useBackgroundTasks";
import { useNotifications } from "@/hooks/app/useNotifications";

// Module-level counter keeps ids unique across the session without Math.random/Date.
let taskCounter = 0;
const nextTaskId = () => `bg-task-${(taskCounter += 1)}`;

export function BackgroundTasksProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<BackgroundTask[]>([]);
  const { notify } = useNotifications();

  const run = useCallback(
    async function run<T>(
      task: () => Promise<T>,
      meta?: { label?: string },
    ): Promise<T | undefined> {
      const id = nextTaskId();
      setPending((prev) => [...prev, { id, label: meta?.label, startedAt: Date.now() }]);

      // The task owns its retries; a rejection here means it gave up. Surface it through the central
      // notification system, then swallow so a voided call can't raise an unhandled rejection. Clear
      // the pending entry whatever the outcome.
      try {
        return await task();
      } catch {
        notify({
          severity: "error",
          message: meta?.label
            ? `${meta.label} failed. Please try again.`
            : "Something went wrong. Please try again.",
        });
        return undefined;
      } finally {
        setPending((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [notify],
  );

  // A guard for the whole app: warn on a real tab close/reload while work is in flight. The listener
  // is attached only while something is pending. In-app navigation keeps the SPA — and the in-page
  // upload — alive, so it's intentionally not guarded (the browser only allows the generic prompt).
  const hasPending = pending.length > 0;
  useEffect(() => {
    if (!hasPending) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPending]);

  const value: BackgroundTasksContextTypes = useMemo(
    () => ({ pending, hasPending, run }),
    [pending, hasPending, run],
  );

  return (
    <BackgroundTasksContext.Provider value={value}>{children}</BackgroundTasksContext.Provider>
  );
}
