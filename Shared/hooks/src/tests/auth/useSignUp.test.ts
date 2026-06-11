import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before the imports they affect
// ---------------------------------------------------------------------------

const capturedMutations: Array<{
  mutationFn: (args: any) => Promise<any>;
  onSuccess: (response: any) => Promise<void>;
  onError: (error: any) => void;
}> = new Array(3);

const capturedMutates: ReturnType<typeof vi.fn>[] = new Array(3);
let _mutationSlot = 0;

const { mockInvalidateQueries, mockTrigger, mockGetValues, mockSetError } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  mockTrigger: vi.fn(),
  mockGetValues: vi.fn(),
  mockSetError: vi.fn(),
}));

// Platform-supplied error sink injected into the hook (web would pass notify).
const mockOnError = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn().mockImplementation((opts: any) => {
    const slot = _mutationSlot % 3;
    _mutationSlot++;
    capturedMutations[slot] = opts;
    capturedMutates[slot] = vi.fn();
    return { mutate: capturedMutates[slot], isPending: false };
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

import { useSignUp } from "../../auth/useSignUp";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockNavigate = { replace: mockReplace };
const mockAxios = { post: vi.fn() } as any;

const mockStartSignUpResponse = {
  data: { otpExpiresAt: "2026-03-09T12:00:00.000Z" },
};

const mockAuthResult = {
  data: { accessToken: "access-token", refreshToken: "refresh-token" },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSignUp", () => {
  // Mutation indices: 0 = startSignUpMutation, 1 = verifyOtpMutation, 2 = completeSignUpMutation
  beforeEach(() => {
    capturedMutations.fill(undefined as any);
    capturedMutates.fill(undefined as any);
    _mutationSlot = 0;
    mockTriggerResult = true;
    mockTrigger.mockImplementation(() => Promise.resolve(mockTriggerResult));
    mockReplace.mockReset();
    mockInvalidateQueries.mockReset();
    mockOnError.mockReset();
    mockTrigger.mockClear();
    mockGetValues.mockReset();
    mockSetError.mockReset();
  });

  describe("exports", () => {
    it("exports signUpHeaderConfig with correct headers for all 5 steps", () => {
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      expect(result.current.signUpHeaderConfig[0].header).toBe("Sign up");
      expect(result.current.signUpHeaderConfig[1].header).toBe("Verify email");
      expect(result.current.signUpHeaderConfig[2].header).toBe("Create password");
      expect(result.current.signUpHeaderConfig[3].header).toBe("Personal details");
      expect(result.current.signUpHeaderConfig[4].header).toBe("What do you collect?");
    });

    it("exposes SIGNUP_TOTAL_STEPS as 5", () => {
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      expect(result.current.SIGNUP_TOTAL_STEPS).toBe(5);
    });
  });

  describe("initial state", () => {
    it("starts on step 0 with no OTP expiry", () => {
      // Act
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Assert
      expect(result.current.step).toBe(0);
      expect(result.current.otpExpiresAt).toBeNull();
    });

    it("exposes all mutation pending states as false initially", () => {
      // Act
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Assert
      expect(result.current.isStarting).toBe(false);
      expect(result.current.isVerifying).toBe(false);
      expect(result.current.isCompleting).toBe(false);
    });
  });

  describe("handleNext — step 0 (start sign-up)", () => {
    it("calls startSignUpMutation.mutate with username and email when validation passes", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      mockGetValues.mockImplementation((field: string) => {
        if (field === "username") return "testuser";
        if (field === "email") return "test@example.com";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[0]).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
      });
    });

    it("does NOT call mutate when form validation fails", async () => {
      // Arrange
      mockTriggerResult = false;
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[0]).not.toHaveBeenCalled();
    });
  });

  describe("startSignUpMutation callbacks", () => {
    it("onSuccess advances to step 1", () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Act
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));

      // Assert
      expect(result.current.step).toBe(1);
    });

    it("onSuccess stores otpExpiresAt", () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Act
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));

      // Assert
      expect(result.current.otpExpiresAt).toEqual(new Date("2026-03-09T12:00:00.000Z"));
    });

    it("onError forwards a normalized message to the error sink", () => {
      // Arrange
      renderHook(() => useSignUp(mockNavigate, mockAxios, undefined, mockOnError));

      // Act
      act(() => capturedMutations[0].onError(new Error("Username taken")));

      // Assert — a plain Error normalizes to the generic message.
      expect(mockOnError).toHaveBeenCalledWith("An unexpected error occurred.");
    });
  });

  describe("handleNext — step 1 (verify OTP)", () => {
    it("calls verifyOtpMutation.mutate with email and otp", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      // Advance to step 1
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      expect(result.current.step).toBe(1);

      mockGetValues.mockImplementation((field: string) => {
        if (field === "email") return "test@example.com";
        if (field === "otp") return "ABC123";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(capturedMutates[1]).toHaveBeenCalledWith({
        email: "test@example.com",
        otp: "ABC123",
      });
    });
  });

  describe("verifyOtpMutation callbacks", () => {
    it("onSuccess advances to step 2", () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      const verifyOtpResponse = { data: { popularInterests: ["cards", "coins"] } };

      // Act
      act(() => capturedMutations[1].onSuccess(verifyOtpResponse));

      // Assert
      expect(result.current.step).toBe(2);
    });

    it("onSuccess stores popular interests", () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      const verifyOtpResponse = { data: { popularInterests: ["cards", "coins"] } };

      // Act
      act(() => capturedMutations[1].onSuccess(verifyOtpResponse));

      // Assert
      expect(result.current.popularInterests).toEqual(["cards", "coins"]);
    });

    it("onError forwards a normalized message to the error sink", () => {
      // Arrange
      renderHook(() => useSignUp(mockNavigate, mockAxios, undefined, mockOnError));

      // Act
      act(() => capturedMutations[1].onError(new Error("Invalid OTP")));

      // Assert
      expect(mockOnError).toHaveBeenCalledWith("An unexpected error occurred.");
    });
  });

  describe("handleNext — step 2 (password)", () => {
    it("advances to step 3 when passwords match", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      // Advance to step 2
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      act(() => capturedMutations[1].onSuccess({ data: { popularInterests: [] } }));
      expect(result.current.step).toBe(2);

      mockGetValues.mockImplementation((field: string) => {
        if (field === "password") return "Test1234!";
        if (field === "confirmPassword") return "Test1234!";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert
      expect(result.current.step).toBe(3);
    });

    it("sets a form error on confirmPassword when passwords do not match", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      act(() => capturedMutations[1].onSuccess({ data: { popularInterests: [] } }));
      expect(result.current.step).toBe(2);

      mockGetValues.mockImplementation((field: string) => {
        if (field === "password") return "Test1234!";
        if (field === "confirmPassword") return "Different9876!";
        return "";
      });

      // Act
      await act(async () => result.current.handleNext());

      // Assert: stays on step 2 and sets an error
      expect(result.current.step).toBe(2);
      expect(mockSetError).toHaveBeenCalledWith(
        "confirmPassword",
        expect.objectContaining({ message: "Passwords do not match" }),
      );
    });
  });

  describe("onSubmit", () => {
    it("calls completeSignUpMutation.mutate with all required fields", () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      const formData = {
        username: "testuser",
        email: "test@example.com",
        password: "Test1234!",
        confirmPassword: "Test1234!",
        otp: "ABC123",
        firstname: "Test",
        lastname: "User",
        dateOfBirth: "1990-01-01",
        interests: ["cards", "coins"],
      };

      // Act
      act(() => result.current.onSubmit(formData));

      // Assert
      expect(capturedMutates[2]).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        password: "Test1234!",
        firstname: "Test",
        lastname: "User",
        dateOfBirth: "1990-01-01",
        interests: ["cards", "coins"],
      });
    });
  });

  describe("completeSignUpMutation callbacks", () => {
    it("onSuccess invalidates user query", async () => {
      // Arrange
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Act
      await act(async () => capturedMutations[2].onSuccess(mockAuthResult));

      // Assert
      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["userDetails"] }),
      );
    });

    it("onSuccess navigates to /", async () => {
      // Arrange
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useSignUp(mockNavigate, mockAxios));

      // Act
      await act(async () => capturedMutations[2].onSuccess(mockAuthResult));

      // Assert
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("onSuccess calls onAuthSuccess when provided", async () => {
      // Arrange
      const mockOnAuthSuccess = vi.fn().mockResolvedValue(undefined);
      mockInvalidateQueries.mockResolvedValue(undefined);
      renderHook(() => useSignUp(mockNavigate, mockAxios, mockOnAuthSuccess));

      // Act
      await act(async () => capturedMutations[2].onSuccess(mockAuthResult));

      // Assert
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockAuthResult.data);
    });

    it("onError forwards a normalized message to the error sink", () => {
      // Arrange
      renderHook(() => useSignUp(mockNavigate, mockAxios, undefined, mockOnError));

      // Act
      act(() => capturedMutations[2].onError(new Error("Sign-up failed")));

      // Assert
      expect(mockOnError).toHaveBeenCalledWith("An unexpected error occurred.");
    });
  });

  describe("onEnter", () => {
    it("triggers handleNext when Enter is pressed before the final step", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      mockGetValues.mockReturnValue("anyvalue");
      const event = { key: "Enter", preventDefault: vi.fn() } as any;

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockTrigger).toHaveBeenCalled();
    });

    it("does not trigger handleNext when Enter is pressed on step 4 (final step)", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));

      // step 0 → 1
      act(() => capturedMutations[0].onSuccess(mockStartSignUpResponse));
      // step 1 → 2
      act(() => capturedMutations[1].onSuccess({ data: { popularInterests: [] } }));
      // step 2 → 3 (passwords must match)
      mockGetValues.mockImplementation((field: string) =>
        field === "password" || field === "confirmPassword" ? "Password1!" : "",
      );
      await act(async () => result.current.handleNext());
      // step 3 → 4
      await act(async () => result.current.handleNext());
      expect(result.current.step).toBe(4);

      const event = { key: "Enter", preventDefault: vi.fn() } as any;
      mockTrigger.mockClear();

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("ignores non-Enter key presses", async () => {
      // Arrange
      const { result } = renderHook(() => useSignUp(mockNavigate, mockAxios));
      const event = { key: "Space", preventDefault: vi.fn() } as any;

      // Act
      await act(async () => result.current.onEnter(event));

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockTrigger).not.toHaveBeenCalled();
    });
  });
});
