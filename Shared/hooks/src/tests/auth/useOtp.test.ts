import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before the imports they affect
// ---------------------------------------------------------------------------

const capturedMutations: Array<{
  mutationFn: (args: { data: { email: string }; mode: "login" | "signup" }) => Promise<any>;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}> = [];

const capturedMutates: ReturnType<typeof vi.fn>[] = [];

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn().mockImplementation((opts: any) => {
    capturedMutations.push(opts);
    const mutate = vi.fn();
    capturedMutates.push(mutate);
    return { mutate, isPending: false };
  }),
}));

// Platform-supplied error sink injected into the hook (web would pass notify).
const mockOnError = vi.fn();

import { useOtp } from "../../auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAxios = { post: vi.fn() } as any;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOtp", () => {
  let futureDate: Date;

  beforeEach(() => {
    capturedMutations.length = 0;
    capturedMutates.length = 0;
    mockOnError.mockReset();
    mockAxios.post.mockReset();
    futureDate = new Date(Date.now() + FIVE_MINUTES_MS);
  });

  describe("initial state", () => {
    it("starts with resend disabled", () => {
      // Act
      const { result } = renderHook(() => useOtp(futureDate, mockAxios));

      // Assert
      expect(result.current.isResendDisabled).toBe(true);
    });

    it("starts with endTime matching the initial expiry timestamp", () => {
      // Act
      const { result } = renderHook(() => useOtp(futureDate, mockAxios));

      // Assert
      expect(result.current.endTime).toBe(futureDate.getTime());
    });
  });

  describe("isResendDisabled timer", () => {
    it("enables resend after 1/5th of the initial OTP duration", () => {
      // Arrange
      vi.useFakeTimers();
      const now = Date.now();
      const expiresAt = new Date(now + FIVE_MINUTES_MS);
      const oneFifth = (expiresAt.getTime() - now) / 5;

      const { result } = renderHook(() => useOtp(expiresAt, mockAxios));
      expect(result.current.isResendDisabled).toBe(true);

      // Act
      act(() => vi.advanceTimersByTime(oneFifth));

      // Assert
      expect(result.current.isResendDisabled).toBe(false);
      vi.useRealTimers();
    });

    it("remains disabled just before the 1/5th mark", () => {
      // Arrange
      vi.useFakeTimers();
      const now = Date.now();
      const expiresAt = new Date(now + FIVE_MINUTES_MS);
      const justBeforeOneFifth = (expiresAt.getTime() - now) / 5 - 1;

      const { result } = renderHook(() => useOtp(expiresAt, mockAxios));

      // Act
      act(() => vi.advanceTimersByTime(justBeforeOneFifth));

      // Assert
      expect(result.current.isResendDisabled).toBe(true);
      vi.useRealTimers();
    });
  });

  describe("handleResend", () => {
    it("calls mutate with the correct data and signup mode", () => {
      // Arrange
      const { result } = renderHook(() => useOtp(futureDate, mockAxios));
      const data = { email: "test@example.com" };

      // Act
      act(() => result.current.handleResend(data, "signup"));

      // Assert
      expect(capturedMutates[0]).toHaveBeenCalledWith({ data, mode: "signup" });
    });

    it("calls mutate with the correct data and login mode", () => {
      // Arrange
      const { result } = renderHook(() => useOtp(futureDate, mockAxios));
      const data = { email: "test@example.com" };

      // Act
      act(() => result.current.handleResend(data, "login"));

      // Assert
      expect(capturedMutates[0]).toHaveBeenCalledWith({ data, mode: "login" });
    });
  });

  describe("mutationFn endpoint routing", () => {
    it("posts to sign-up/resend-otp when mode is signup", async () => {
      // Arrange
      mockAxios.post.mockResolvedValue({ data: { otpExpiresAt: new Date().toISOString() } });
      renderHook(() => useOtp(futureDate, mockAxios));

      // Act
      await capturedMutations[0].mutationFn({ data: { email: "a@b.com" }, mode: "signup" });

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        "sign-up/resend-otp",
        expect.objectContaining({ email: "a@b.com" }),
      );
    });

    it("posts to login/resend-otp when mode is login", async () => {
      // Arrange
      mockAxios.post.mockResolvedValue({ data: { otpExpiresAt: new Date().toISOString() } });
      renderHook(() => useOtp(futureDate, mockAxios));

      // Act
      await capturedMutations[0].mutationFn({ data: { email: "a@b.com" }, mode: "login" });

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        "login/resend-otp",
        expect.objectContaining({ email: "a@b.com" }),
      );
    });
  });

  describe("onSuccess", () => {
    it("updates endTime to the new OTP expiry", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useOtp(futureDate, mockAxios));
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Act
      act(() =>
        capturedMutations[0].onSuccess({ data: { otpExpiresAt: newExpiry.toISOString() } }),
      );

      // Assert
      expect(result.current.endTime).toBe(newExpiry.getTime());
      vi.useRealTimers();
    });

    it("resets isResendDisabled to true after a successful resend", () => {
      // Arrange
      vi.useFakeTimers();
      const now = Date.now();
      const expiresAt = new Date(now + FIVE_MINUTES_MS);
      const oneFifth = (expiresAt.getTime() - now) / 5;
      const { result } = renderHook(() => useOtp(expiresAt, mockAxios));

      // Enable resend first
      act(() => vi.advanceTimersByTime(oneFifth));
      expect(result.current.isResendDisabled).toBe(false);

      // Act: successful resend
      const newExpiry = new Date(Date.now() + FIVE_MINUTES_MS);
      act(() =>
        capturedMutations[0].onSuccess({ data: { otpExpiresAt: newExpiry.toISOString() } }),
      );

      // Assert: resend is disabled again while the new window starts
      expect(result.current.isResendDisabled).toBe(true);
      vi.useRealTimers();
    });

    it("clears previous resend timer when a new OTP is issued", () => {
      // Arrange
      vi.useFakeTimers();
      const now = Date.now();
      const expiresAt = new Date(now + FIVE_MINUTES_MS);
      const { result } = renderHook(() => useOtp(expiresAt, mockAxios));

      // Advance halfway to the initial 1/5 timer and trigger a successful resend.
      act(() => vi.advanceTimersByTime(30_000));
      const newExpiry = new Date(Date.now() + FIVE_MINUTES_MS);
      act(() =>
        capturedMutations[0].onSuccess({ data: { otpExpiresAt: newExpiry.toISOString() } }),
      );

      // If the original timer was not cleared, resend would be enabled after 60s total.
      act(() => vi.advanceTimersByTime(31_000));
      expect(result.current.isResendDisabled).toBe(true);

      // It should only enable at the new timer boundary.
      act(() => vi.advanceTimersByTime(29_000));
      expect(result.current.isResendDisabled).toBe(false);
      vi.useRealTimers();
    });
  });

  describe("onError", () => {
    it("forwards a normalized message to the error sink", () => {
      // Arrange
      renderHook(() => useOtp(futureDate, mockAxios, mockOnError));

      // Act
      act(() => capturedMutations[0].onError(new Error("Network error")));

      // Assert — a plain Error normalizes to the generic message.
      expect(mockOnError).toHaveBeenCalledWith("An unexpected error occurred.");
    });
  });
});
