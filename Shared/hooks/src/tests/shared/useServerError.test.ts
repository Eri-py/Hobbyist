import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

import { useServerError } from "../../shared/useServerError";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAxiosError = (message?: string): AxiosError<{ message?: string }> => {
  const response = message
    ? {
        data: { message },
        status: 400,
        statusText: "Bad Request",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      }
    : undefined;

  return new AxiosError<{ message?: string }>(
    "Request failed",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    response as any,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useServerError", () => {
  describe("initial state", () => {
    it("starts with no error message", () => {
      // Act
      const { result } = renderHook(() => useServerError());

      // Assert
      expect(result.current.serverErrorMessage).toBeNull();
    });
  });

  describe("handleServerError", () => {
    it("sets message from response.data.message", () => {
      // Arrange
      const { result } = renderHook(() => useServerError());

      // Act
      act(() => result.current.handleServerError(makeAxiosError("Email already taken")));

      // Assert
      expect(result.current.serverErrorMessage).toBe("Email already taken");
    });

    it("falls back to generic message when response has no message field", () => {
      // Arrange
      const { result } = renderHook(() => useServerError());
      const error = new AxiosError<{ message?: string }>(
        "Request failed",
        "ERR_BAD_RESPONSE",
        undefined,
        undefined,
        {
          data: {},
          status: 400,
          statusText: "Bad Request",
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
        } as any,
      );

      // Act
      act(() => result.current.handleServerError(error));

      // Assert
      expect(result.current.serverErrorMessage).toBe("An unexpected error occurred.");
    });

    it("falls back to generic message when there is no response at all", () => {
      // Arrange
      const { result } = renderHook(() => useServerError());
      const error = new AxiosError("Network Error");

      // Act
      act(() => result.current.handleServerError(error as any));

      // Assert
      expect(result.current.serverErrorMessage).toBe("An unexpected error occurred.");
    });
  });

  describe("clearServerError", () => {
    it("clears the error message immediately", () => {
      // Arrange
      const { result } = renderHook(() => useServerError());
      act(() => result.current.handleServerError(makeAxiosError("Something failed")));
      expect(result.current.serverErrorMessage).toBe("Something failed");

      // Act
      act(() => result.current.clearServerError());

      // Assert
      expect(result.current.serverErrorMessage).toBeNull();
    });
  });

  describe("auto-clear timer", () => {
    it("clears the error message after 10 seconds", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useServerError());
      act(() => result.current.handleServerError(makeAxiosError("Timed error")));
      expect(result.current.serverErrorMessage).toBe("Timed error");

      // Act
      act(() => vi.advanceTimersByTime(10000));

      // Assert
      expect(result.current.serverErrorMessage).toBeNull();
      vi.useRealTimers();
    });

    it("does not clear before 10 seconds have elapsed", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useServerError());
      act(() => result.current.handleServerError(makeAxiosError("Timed error")));

      // Act
      act(() => vi.advanceTimersByTime(9999));

      // Assert
      expect(result.current.serverErrorMessage).toBe("Timed error");
      vi.useRealTimers();
    });

    it("resets the 10-second window when a new error replaces the old one", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useServerError());
      act(() => result.current.handleServerError(makeAxiosError("First error")));

      // Advance most of the way through the first error's window
      act(() => vi.advanceTimersByTime(9000));

      // Then set a second error — this resets the 10s countdown
      act(() => result.current.handleServerError(makeAxiosError("Second error")));

      // Advance 9 more seconds (18 total from start, but only 9 from second error)
      act(() => vi.advanceTimersByTime(9000));

      // Assert: second error is still showing (within its own 10s window)
      expect(result.current.serverErrorMessage).toBe("Second error");

      // Now the full 10s from the second error has elapsed
      act(() => vi.advanceTimersByTime(1001));
      expect(result.current.serverErrorMessage).toBeNull();
      vi.useRealTimers();
    });
  });
});
