import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before the imports they affect
// ---------------------------------------------------------------------------

const capturedMutations: Array<{
  mutationFn: (args: any) => Promise<any>;
  onSuccess: (response: any) => Promise<void>;
  onError: (error: any) => void;
}> = [];

const capturedMutates: ReturnType<typeof vi.fn>[] = [];

const {
  mockInvalidateQueries,
  mockTrigger,
  mockGetValues,
  mockSetError,
  mockHandleServerError,
  mockClearServerError,
} = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  mockTrigger: vi.fn(),
  mockGetValues: vi.fn(),
  mockSetError: vi.fn(),
  mockHandleServerError: vi.fn(),
  mockClearServerError: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn().mockImplementation((opts: any) => {
    capturedMutations.push(opts);
    const mutate = vi.fn();
    capturedMutates.push(mutate);
    return { mutate, isPending: false };
  }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: mockInvalidateQueries }),
}));

// Control trigger return value per test
let mockTriggerResult = true;

vi.mock("react-hook-form", () => ({
  useForm: vi.fn().mockReturnValue({
    trigger: mockTrigger,
    getValues: mockGetValues,
    setError: mockSetError,
    setValue: vi.fn(),
    handleSubmit: vi.fn(),
    register: vi.fn(),
    formState: { errors: {} },
  }),
}));

vi.mock("../../shared/useServerError", () => ({
  useServerError: vi.fn().mockReturnValue({
    serverErrorMessage: null,
    handleServerError: mockHandleServerError,
    clearServerError: mockClearServerError,
  }),
}));

import { useLogin } from "../../auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockNavigate = { replace: mockReplace };
const mockAxios = { post: vi.fn() } as any;

const mockStartLoginResponse = {
  data: { email: "user@example.com", otpExpiresAt: "2026-03-09T12:00:00.000Z" },
};

const mockAuthResult = {
  data: { accessToken: "access-token", refreshToken: "refresh-token" },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useLogin", () => {
  // Mutation indices: 0 = startLoginMutation, 1 = completeLoginMutation
  beforeEach(() => {
    capturedMutations.length = 0;
    capturedMutates.length = 0;
    mockTriggerResult = true;
    mockTrigger.mockImplementation(() => Promise.resolve(mockTriggerResult));
    mockReplace.mockReset();
    mockInvalidateQueries.mockReset();
    mockHandleServerError.mockReset();
    mockClearServerError.mockReset();
    mockTrigger.mockClear();
    mockGetValues.mockReset();
    mockSetError.mockReset();
  });

  describe("exports", () => {
    it("exports loginHeaderConfig with headers for step 0 and step 1", () => {
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      expect(result.current.loginHeaderConfig[0].header).toBe("Log in");
      expect(result.current.loginHeaderConfig[1].header).toBe("Verify email");
    });

    it("exports LOGIN_TOTAL_STEPS as 2", () => {
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      expect(result.current.LOGIN_TOTAL_STEPS).toBe(2);
    });
  });

  describe("initial state", () => {
    it("starts on step 0 with no OTP data", () => {
      // Act
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      // Assert
      expect(result.current.step).toBe(0);
      expect(result.current.otpData).toBeNull();
    });

    it("exposes mutation pending states as false initially", () => {
      // Act
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      // Assert
      expect(result.current.isStarting).toBe(false);
      expect(result.current.isCompleting).toBe(false);
    });
  });

  describe("handleNext (step 0)", () => {
    it("calls startLoginMutation.mutate when validation passes", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      mockGetValues.mockImplementation((field: string) => {
        if (field === "identifier") return "testuser";
        if (field === "password") return "Test1234!";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[0]).toHaveBeenCalled();
    });

    it("passes identifier and password to startLoginMutation.mutate", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      mockGetValues.mockImplementation((field: string) => {
        if (field === "identifier") return "testuser";
        if (field === "password") return "Test1234!";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[0]).toHaveBeenCalledWith({
        identifier: "testuser",
        password: "Test1234!",
      });
    });

    it("does NOT call mutate when form validation fails", async () => {
      // Arrange
      mockTriggerResult = false;
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[0]).not.toHaveBeenCalled();
    });

    it("clears server error before firing the mutation", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      mockGetValues.mockReturnValue("anyvalue");

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  describe("startLoginMutation callbacks", () => {
    it("onSuccess advances to step 1", () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      // Act
      act(() => capturedMutations[0].onSuccess(mockStartLoginResponse));

      // Assert
      expect(result.current.step).toBe(1);
    });

    it("onSuccess stores otpData", () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));

      // Act
      act(() => capturedMutations[0].onSuccess(mockStartLoginResponse));

      // Assert
      expect(result.current.otpData).toEqual({
        email: "user@example.com",
        otpExpiresAt: "2026-03-09T12:00:00.000Z",
      });
    });

    it("onError calls handleServerError", () => {
      // Arrange
      renderHook(() => useLogin(mockNavigate, mockAxios));
      const error = new Error("Invalid credentials") as any;

      // Act
      act(() => capturedMutations[0].onError(error));

      // Assert
      expect(mockHandleServerError).toHaveBeenCalledWith(error);
    });
  });

  describe("onSubmit", () => {
    it("calls completeLoginMutation.mutate with identifier and otp", () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      const formData = { identifier: "testuser", password: "Test1234!", otp: "ABC123" };

      // Act
      act(() => result.current.onSubmit(formData));

      // Assert
      expect(capturedMutates[1]).toHaveBeenCalledWith({
        identifier: "testuser",
        otp: "ABC123",
      });
    });

    it("clears server error before submitting", () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      const formData = { identifier: "testuser", password: "Test1234!", otp: "ABC123" };

      // Act
      act(() => result.current.onSubmit(formData));

      // Assert
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  describe("completeLoginMutation callbacks", () => {
    it("onSuccess invalidates user query", async () => {
      // Arrange
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useLogin(mockNavigate, mockAxios));

      // Act
      await act(async () => capturedMutations[1].onSuccess(mockAuthResult));

      // Assert
      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["userDetails"] }),
      );
    });

    it("onSuccess navigates to /", async () => {
      // Arrange
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useLogin(mockNavigate, mockAxios));

      // Act
      await act(async () => capturedMutations[1].onSuccess(mockAuthResult));

      // Assert
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("onSuccess calls onAuthSuccess when provided", async () => {
      // Arrange
      const mockOnAuthSuccess = vi.fn().mockResolvedValue(undefined);
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useLogin(mockNavigate, mockAxios, mockOnAuthSuccess));

      // Act
      await act(async () => capturedMutations[1].onSuccess(mockAuthResult));

      // Assert
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockAuthResult.data);
    });

    it("onError calls handleServerError", () => {
      // Arrange
      renderHook(() => useLogin(mockNavigate, mockAxios));
      const error = new Error("Bad OTP") as any;

      // Act
      act(() => capturedMutations[1].onError(error));

      // Assert
      expect(mockHandleServerError).toHaveBeenCalledWith(error);
    });
  });

  describe("onEnter", () => {
    it("triggers handleNext when Enter is pressed on step 0", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      mockGetValues.mockReturnValue("anyvalue");
      const event = { key: "Enter", preventDefault: vi.fn() } as any;

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockTrigger).toHaveBeenCalled();
    });

    it("does not trigger handleNext when Enter is pressed on step 1", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      // Advance to step 1
      act(() => capturedMutations[0].onSuccess(mockStartLoginResponse));
      expect(result.current.step).toBe(1);

      const event = { key: "Enter", preventDefault: vi.fn() } as any;
      mockTrigger.mockClear();

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert — trigger should not have been called for step >= 1
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("ignores non-Enter key presses", async () => {
      // Arrange
      const { result } = renderHook(() => useLogin(mockNavigate, mockAxios));
      const event = { key: "Tab", preventDefault: vi.fn() } as any;

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockTrigger).not.toHaveBeenCalled();
    });
  });
});
