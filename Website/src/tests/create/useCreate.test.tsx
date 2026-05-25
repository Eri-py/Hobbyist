import { type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("@/api/axiosInstance", () => ({
  axiosInstance: { post: mockPost },
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
  id: `file-${name}`,
  file: new File(["x"], name, { type: "image/jpeg" }),
  preview: "data:image/jpeg;base64,preview",
});

const noopOnPostCreated = vi.fn();

const validValues = {
  hobby: "Trading Cards",
  title: "My Item",
  description: "Some description here.",
  availableForTrade: false as boolean,
  lookingFor: "",
};

const PUBLISHED_POST_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const DRAFT_POST_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const setupPostMock = ({
  publishedPostId = PUBLISHED_POST_ID,
  draftPostId = DRAFT_POST_ID,
}: { publishedPostId?: string; draftPostId?: string } = {}) => {
  mockPost.mockImplementation((url: string) => {
    if (url === "posts/create") return Promise.resolve({ data: { postId: publishedPostId } });
    if (url === "posts/draft") return Promise.resolve({ data: { postId: draftPostId } });
    return Promise.resolve({ data: {} });
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreate", () => {
  beforeEach(() => {
    noopOnPostCreated.mockReset();
    mockPost.mockReset();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it("starts at step 0", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.activeStep).toBe(0);
    });

    it("exposes all required callbacks and state", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.methods).toBeDefined();
      expect(result.current.handleNext).toBeTypeOf("function");
      expect(result.current.handleBack).toBeTypeOf("function");
      expect(result.current.handleSubmit).toBeTypeOf("function");
      expect(result.current.saveDraft).toBeTypeOf("function");
    });

    it("isSavingDraft starts as false", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.isSavingDraft).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleNext — step 0 (media)
  // -------------------------------------------------------------------------

  describe("handleNext at step 0", () => {
    it("calls onFilesError and stays at step 0 when no files are provided", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      await act(async () => {
        await result.current.handleNext([], onFilesError);
      });

      expect(onFilesError).toHaveBeenCalledOnce();
      expect(result.current.activeStep).toBe(0);
    });

    it("advances to step 1 when files are present", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      await act(async () => {
        await result.current.handleNext([makeFile()], onFilesError);
      });

      expect(onFilesError).not.toHaveBeenCalled();
      expect(result.current.activeStep).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // handleNext — step 1 (form validation)
  // -------------------------------------------------------------------------

  describe("handleNext at step 1", () => {
    const setupAtStep1 = async (
      result: ReturnType<typeof renderHook<ReturnType<typeof useCreate>, unknown>>["result"],
    ) => {
      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });
      expect(result.current.activeStep).toBe(1);
    };

    it("stays at step 1 when form fields are invalid", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      await setupAtStep1(result);

      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });

      expect(result.current.activeStep).toBe(1);
    });

    it("does not advance past the last step when all fields are valid", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      await setupAtStep1(result);
      act(() => {
        result.current.methods.setValue("hobby", "Trading Cards");
        result.current.methods.setValue("title", "My Hobby Item");
        result.current.methods.setValue("description", "A detailed description.");
      });

      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });

      expect(result.current.activeStep).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // handleBack
  // -------------------------------------------------------------------------

  describe("handleBack", () => {
    it("does not go below step 0", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      act(() => result.current.handleBack());
      expect(result.current.activeStep).toBe(0);
    });

    it("moves from step 1 back to step 0", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });
      expect(result.current.activeStep).toBe(1);

      act(() => result.current.handleBack());

      expect(result.current.activeStep).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleSubmit
  // -------------------------------------------------------------------------

  describe("handleSubmit", () => {
    it("calls onFilesError and does not call the API when files array is empty", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit(validValues, [], onFilesError));

      expect(onFilesError).toHaveBeenCalledOnce();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls posts/create with files and form data when files are present", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit(validValues, [makeFile()], onFilesError));

      expect(onFilesError).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "posts/create",
          expect.any(FormData),
          { timeout: 60_000 },
        );
      });
    });

    it("calls onPostCreated immediately without waiting for the API", () => {
      setupPostMock({ publishedPostId: PUBLISHED_POST_ID });
      const onPostCreated = vi.fn();
      const { result } = renderHook(() => useCreate(onPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.handleSubmit(validValues, [makeFile()], vi.fn()));

      expect(onPostCreated).toHaveBeenCalledOnce();
      expect(onPostCreated).toHaveBeenCalledWith();
    });

    it("fails silently when the API errors", async () => {
      mockPost.mockRejectedValueOnce(new Error("server error"));
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.handleSubmit(validValues, [makeFile()], vi.fn()));

      await waitFor(() => expect(mockPost).toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // saveDraft
  // -------------------------------------------------------------------------

  describe("saveDraft", () => {
    it("calls posts/draft with the provided files", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await act(async () => {
        await result.current.saveDraft([makeFile()]);
      });

      expect(mockPost).toHaveBeenCalledWith("posts/draft", expect.any(FormData), { timeout: 60_000 });
    });

    it("resolves with the draft post id on success", async () => {
      setupPostMock({ draftPostId: DRAFT_POST_ID });
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      let postId: string | undefined;
      await act(async () => {
        const response = await result.current.saveDraft([makeFile()]);
        postId = response.data.postId;
      });

      expect(postId).toBe(DRAFT_POST_ID);
    });

    it("rejects when the API fails", async () => {
      mockPost.mockRejectedValueOnce(new Error("network error"));
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      let threw = false;
      await act(async () => {
        try {
          await result.current.saveDraft([makeFile()]);
        } catch {
          threw = true;
        }
      });

      expect(threw).toBe(true);
    });
  });
});
