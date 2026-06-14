import { type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// The provider surfaces failures through the central notification system; spy on it.
const mockNotify = vi.fn();
vi.mock("@/hooks/app/useNotifications", () => ({
  useNotifications: () => ({ notify: mockNotify, dismiss: vi.fn() }),
}));

import { BackgroundTasksProvider } from "@/providers/app/BackgroundTasksProvider";
import { useBackgroundTasks } from "@/hooks/app/useBackgroundTasks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: ReactNode }) => (
  <BackgroundTasksProvider>{children}</BackgroundTasksProvider>
);

const renderTasks = () => renderHook(() => useBackgroundTasks(), { wrapper }).result;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const dispatchBeforeUnload = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BackgroundTasksProvider", () => {
  beforeEach(() => mockNotify.mockClear());

  it("throws when useBackgroundTasks is used outside the provider", () => {
    expect(() => renderHook(() => useBackgroundTasks())).toThrow(
      /must be used within a BackgroundTasksProvider/,
    );
  });

  it("registers a task while it runs and clears it on success", async () => {
    const result = renderTasks();
    const task = deferred<string>();

    let settled: Promise<string | undefined>;
    act(() => {
      settled = result.current.run(() => task.promise, { label: "Publishing your post" });
    });

    expect(result.current.hasPending).toBe(true);
    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0].label).toBe("Publishing your post");

    await act(async () => {
      task.resolve("done");
      await settled;
    });

    expect(result.current.hasPending).toBe(false);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("notifies with a labelled error and clears the task when it gives up", async () => {
    const result = renderTasks();
    const task = deferred<string>();

    let settled: Promise<string | undefined>;
    act(() => {
      settled = result.current.run(() => task.promise, { label: "Publishing your post" });
    });

    await act(async () => {
      task.reject(new Error("gave up"));
      await settled;
    });

    expect(result.current.hasPending).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "error",
        message: "Publishing your post failed.",
      }),
    );
  });

  it("uses a generic message when the task has no label", async () => {
    const result = renderTasks();

    await act(async () => {
      await result.current.run(() => Promise.reject(new Error("x")));
    });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Something went wrong." }),
    );
  });

  it("offers a Retry action that re-runs the failed task as a fresh tracked attempt", async () => {
    const result = renderTasks();
    const task = vi.fn(() => Promise.reject(new Error("gave up")));

    await act(async () => {
      await result.current.run(task, { label: "Publishing your post" });
    });

    expect(task).toHaveBeenCalledTimes(1);
    expect(result.current.hasPending).toBe(false);

    const { action } = mockNotify.mock.calls[0][0];
    expect(action.label).toBe("Retry");

    await act(async () => {
      action.onClick();
      await Promise.resolve();
    });

    expect(task).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.hasPending).toBe(false));
    expect(mockNotify).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: expect.objectContaining({ label: "Retry" }) }),
    );
  });

  it("resolves to the task value on success and undefined on failure", async () => {
    const result = renderTasks();

    let okValue: number | undefined;
    let failValue: number | undefined;
    await act(async () => {
      okValue = await result.current.run(() => Promise.resolve(42));
    });
    await act(async () => {
      failValue = await result.current.run<number>(() => Promise.reject(new Error("x")));
    });

    expect(okValue).toBe(42);
    expect(failValue).toBeUndefined();
  });

  it("tracks multiple concurrent tasks independently", async () => {
    const result = renderTasks();
    const a = deferred<void>();
    const b = deferred<void>();

    let settledA: Promise<void | undefined>;
    act(() => {
      settledA = result.current.run(() => a.promise);
      result.current.run(() => b.promise);
    });
    expect(result.current.pending).toHaveLength(2);

    await act(async () => {
      a.resolve();
      await settledA;
    });
    expect(result.current.hasPending).toBe(true);
    expect(result.current.pending).toHaveLength(1);

    await act(async () => {
      b.resolve();
    });
    await waitFor(() => expect(result.current.hasPending).toBe(false));
  });

  it("prevents unload only while a task is pending", async () => {
    const result = renderTasks();

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    const task = deferred<void>();
    act(() => {
      result.current.run(() => task.promise);
    });

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    await act(async () => {
      task.resolve();
    });
    await waitFor(() => expect(result.current.hasPending).toBe(false));

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });
});
