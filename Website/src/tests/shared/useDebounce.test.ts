import { act, renderHook } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";

import { useDebounce } from "@/hooks/shared/useDebounce";

describe("useDebounce", () => {
  // Freeze time before every test so setTimeout never fires on its own.
  // afterEach restores real time so other tests aren't affected.
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value immediately on mount", () => {
    // Act
    const { result } = renderHook(() => useDebounce("hello", 500));

    // Assert
    expect(result.current).toBe("hello");
  });

  it("does not update the value before the delay has elapsed", () => {
    // Arrange
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "first" },
    });

    // Act
    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(499));

    // Assert
    expect(result.current).toBe("first");
  });

  it("updates the value once the delay has fully elapsed", () => {
    // Arrange
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "first" },
    });

    // Act
    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(500));

    // Assert
    expect(result.current).toBe("second");
  });

  it("resets the timer on each new value; only the last value wins", () => {
    // Arrange
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    });

    // Act
    rerender({ value: "b" });
    // 400ms pass, then another change arrives before the timer fires
    act(() => vi.advanceTimersByTime(400));
    rerender({ value: "c" });
    // 500ms from the *last* change
    act(() => vi.advanceTimersByTime(500));

    // Assert — "b" should have been cancelled; only "c" makes it through
    expect(result.current).toBe("c");
  });

  it("never runs more than one timer at a time", () => {
    // Arrange
    const { rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "a" },
    });
    expect(vi.getTimerCount()).toBe(1);

    // Act
    rerender({ value: "b" });

    // Assert — if cleanup wasn't working, this would be 2
    expect(vi.getTimerCount()).toBe(1);
  });

  it("uses 500ms as the default delay when none is provided", () => {
    // Arrange
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "first" },
    });

    // Act
    rerender({ value: "second" });

    // Assert
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("first");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("second");
  });

  it("works with non-string types", () => {
    // Arrange
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 1 },
    });

    // Act
    rerender({ value: 99 });
    act(() => vi.advanceTimersByTime(500));

    // Assert
    expect(result.current).toBe(99);
  });
});
