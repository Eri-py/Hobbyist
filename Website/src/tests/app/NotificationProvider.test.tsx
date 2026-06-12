import { type ReactNode } from "react";
import {
  renderHook,
  act,
  waitFor,
  waitForElementToBeRemoved,
  screen,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { BreakpointContext } from "@/hooks/shared/useDeviceType";
import { NotificationProvider } from "@/providers/app/NotificationProvider";
import { useNotifications } from "@/hooks/app/useNotifications";

// renderHook renders the wrapper — which includes the provider and its viewport — into the
// document, so `screen` can query the rendered banners while `result.current` drives notify/dismiss.
const renderProvider = (isDesktop = true) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BreakpointContext.Provider value={{ isDesktop }}>
      <NotificationProvider>{children}</NotificationProvider>
    </BreakpointContext.Provider>
  );
  return renderHook(() => useNotifications(), { wrapper });
};

describe("NotificationProvider", () => {
  it("throws when useNotifications is used outside the provider", () => {
    expect(() => renderHook(() => useNotifications())).toThrow(
      /must be used within a NotificationProvider/,
    );
  });

  it("shows a notification and returns its id", async () => {
    const { result } = renderProvider();

    let id = "";
    act(() => {
      id = result.current.notify({ message: "Draft saved.", severity: "success", duration: null });
    });

    expect(typeof id).toBe("string");
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
  });

  it("replaces a notification with the same key instead of stacking", async () => {
    const { result } = renderProvider();

    act(() => {
      result.current.notify({ message: "First", severity: "error", duration: null, key: "auth" });
    });
    act(() => {
      result.current.notify({ message: "Second", severity: "error", duration: null, key: "auth" });
    });

    await screen.findByText("Second");
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("removes a notification via dismiss", async () => {
    const { result } = renderProvider();

    let id = "";
    act(() => {
      id = result.current.notify({ message: "Bye", severity: "info", duration: null });
    });
    await screen.findByText("Bye");

    act(() => result.current.dismiss(id));
    await waitFor(() => expect(screen.queryByText("Bye")).toBeNull());
  });

  it("removes a keyed notification via dismissKey", async () => {
    const { result } = renderProvider();

    act(() => {
      result.current.notify({
        message: "Login failed.",
        severity: "error",
        duration: null,
        key: "auth-error",
      });
    });
    await screen.findByText("Login failed.");

    act(() => result.current.dismissKey("auth-error"));
    await waitFor(() => expect(screen.queryByText("Login failed.")).toBeNull());
  });

  it("dismissKey leaves notifications carrying a different key untouched", async () => {
    const { result } = renderProvider();

    act(() => {
      result.current.notify({ message: "Keep me", severity: "info", duration: null, key: "other" });
    });
    await screen.findByText("Keep me");

    act(() => result.current.dismissKey("auth-error"));
    expect(screen.getByText("Keep me")).toBeTruthy();
  });

  it("auto-hides after its duration", async () => {
    const { result } = renderProvider();

    act(() => {
      result.current.notify({ message: "Temporary", severity: "info", duration: 50 });
    });
    await screen.findByText("Temporary");

    await waitForElementToBeRemoved(() => screen.queryByText("Temporary"), { timeout: 2000 });
  });

  it("shows at most three notifications on desktop, queuing the rest", async () => {
    const { result } = renderProvider(true);

    act(() => {
      result.current.notify({ message: "N1", severity: "info", duration: null });
      result.current.notify({ message: "N2", severity: "info", duration: null });
      result.current.notify({ message: "N3", severity: "info", duration: null });
      result.current.notify({ message: "N4", severity: "info", duration: null });
    });

    await screen.findByText("N1");
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.queryByText("N4")).toBeNull();
  });

  it("shows one notification at a time on mobile", async () => {
    const { result } = renderProvider(false);

    act(() => {
      result.current.notify({ message: "M1", severity: "info", duration: null });
      result.current.notify({ message: "M2", severity: "info", duration: null });
    });

    await screen.findByText("M1");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText("M2")).toBeNull();
  });

  it("renders an action that fires its handler and dismisses", async () => {
    const onClick = vi.fn();
    const { result } = renderProvider();

    act(() => {
      result.current.notify({
        message: "Couldn't publish.",
        severity: "error",
        action: { label: "Retry", onClick },
      });
    });

    const retry = await screen.findByRole("button", { name: "Retry" });
    fireEvent.click(retry);

    expect(onClick).toHaveBeenCalledOnce();
    await waitForElementToBeRemoved(() => screen.queryByText("Couldn't publish."), {
      timeout: 2000,
    });
  });
});
