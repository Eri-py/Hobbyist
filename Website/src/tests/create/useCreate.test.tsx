import { type ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockClearServerError = vi.fn();
const mockHandleServerError = vi.fn();

vi.mock("@hobbyist/hooks", () => ({
  useServerError: vi.fn(() => ({
    serverErrorMessage: null,
    handleServerError: mockHandleServerError,
    clearServerError: mockClearServerError,
  })),
}));

vi.mock("@/api/axiosInstance", () => ({
  axiosInstance: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { useCreate } from "@/hooks/create/useCreate";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const makeWrapper = () => {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const makeFile = (name = "photo.jpg"): FileWithMetadata => ({
  id: "file-1",
  file: new File(["x"], name, { type: "image/jpeg" }),
  preview: "data:image/jpeg;base64,preview",
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useCreate", () => {
  beforeEach(() => {
    mockClearServerError.mockReset();
    mockHandleServerError.mockReset();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("starts at step 0", () => {
      // Act
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });

      // Assert
      expect(result.current.activeStep).toBe(0);
    });

    it("exposes form methods, step navigation and submit handler", () => {
      // Act
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });

      // Assert
      expect(result.current.methods).toBeDefined();
      expect(result.current.handleNext).toBeTypeOf("function");
      expect(result.current.handleBack).toBeTypeOf("function");
      expect(result.current.handleSubmit).toBeTypeOf("function");
    });

    it("isSubmitting starts as false", () => {
      // Act
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });

      // Assert
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleNext — step 0 (media selection)
  // -------------------------------------------------------------------------
  describe("handleNext at step 0", () => {
    it("calls onFilesError and stays at step 0 when no files are provided", async () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      // Act
      await act(async () => {
        await result.current.handleNext([], onFilesError);
      });

      // Assert
      expect(onFilesError).toHaveBeenCalledWith(
        "Please upload at least one image or video before continuing.",
      );
      expect(result.current.activeStep).toBe(0);
    });

    it("advances to step 1 when at least one file is provided", async () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      // Act
      await act(async () => {
        await result.current.handleNext([makeFile()], onFilesError);
      });

      // Assert
      expect(onFilesError).not.toHaveBeenCalled();
      expect(result.current.activeStep).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // handleNext — step 1 (form validation)
  // -------------------------------------------------------------------------
  describe("handleNext at step 1", () => {
    // Helper: advance to step 1 first
    const setupAtStep1 = async (
      result: ReturnType<typeof renderHook<ReturnType<typeof useCreate>, unknown>>["result"],
    ) => {
      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });
      expect(result.current.activeStep).toBe(1);
    };

    it("does not call clearServerError when form fields are invalid", async () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      await setupAtStep1(result);

      // Act — form is empty, title and description are required
      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });

      // Assert
      expect(mockClearServerError).not.toHaveBeenCalled();
    });

    it("calls clearServerError when all required form fields are valid", async () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      await setupAtStep1(result);
      act(() => {
        result.current.methods.setValue("title", "My Hobby Item");
        result.current.methods.setValue("description", "A detailed description of my item.");
      });

      // Act
      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });

      // Assert
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleBack
  // -------------------------------------------------------------------------
  describe("handleBack", () => {
    it("does not go below step 0", () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });

      // Act
      act(() => result.current.handleBack());

      // Assert
      expect(result.current.activeStep).toBe(0);
    });

    it("moves from step 1 back to step 0", async () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });
      expect(result.current.activeStep).toBe(1);

      // Act
      act(() => result.current.handleBack());

      // Assert
      expect(result.current.activeStep).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleSubmit
  // -------------------------------------------------------------------------
  describe("handleSubmit", () => {
    it("calls onFilesError and does not mutate when files array is empty", () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      // Act
      act(() => {
        result.current.handleSubmit(
          { title: "My Item", description: "Some description here.", availableForTrade: false },
          [],
          onFilesError,
        );
      });

      // Assert
      expect(onFilesError).toHaveBeenCalledWith(
        "Please upload at least one image or video before continuing.",
      );
    });

    it("calls clearServerError and does not crash when files are present", () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();
      const file = makeFile();

      // Act
      act(() => {
        result.current.handleSubmit(
          { title: "My Item", description: "Some description here.", availableForTrade: false },
          [file],
          onFilesError,
        );
      });

      // Assert
      expect(onFilesError).not.toHaveBeenCalled();
      expect(mockClearServerError).toHaveBeenCalled();
    });

    it("includes optional lookingFor in the call when provided", () => {
      // Arrange
      const { result } = renderHook(() => useCreate(), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      // Act / Assert
      expect(() => {
        act(() => {
          result.current.handleSubmit(
            {
              title: "My Item",
              description: "Some description here.",
              availableForTrade: true,
              lookingFor: "Baseball cards",
            },
            [makeFile()],
            onFilesError,
          );
        });
      }).not.toThrow();
    });
  });
});
