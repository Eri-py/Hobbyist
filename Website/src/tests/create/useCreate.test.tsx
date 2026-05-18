import { type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
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

const DRAFT_POST_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PUBLISHED_POST_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

// vi.mock is hoisted to the top of the file, so the fns must be created with
// vi.hoisted to be available inside the factory before const declarations run.
const { mockPost, mockDelete } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/api/axiosInstance", () => ({
  axiosInstance: {
    post: mockPost,
    delete: mockDelete,
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
  id: `file-${name}`,
  file: new File(["x"], name, { type: "image/jpeg" }),
  preview: "data:image/jpeg;base64,preview",
});

const noopOnPostCreated = vi.fn();

// ---------------------------------------------------------------------------
// Mock responses
// ---------------------------------------------------------------------------

/** Sets up axiosInstance.post to return appropriate shapes per endpoint. */
const setupPostMock = ({
  draftKeys = ["key1"],
  publishedPostId = PUBLISHED_POST_ID,
  addedKey = "added-key",
}: {
  draftKeys?: string[];
  publishedPostId?: string;
  addedKey?: string;
} = {}) => {
  mockPost.mockImplementation((url: string) => {
    if (url === "posts/draft") {
      return Promise.resolve({
        data: { postId: DRAFT_POST_ID, mediaObjectKeys: draftKeys },
      });
    }
    if (url.endsWith("/publish")) {
      return Promise.resolve({ data: { postId: publishedPostId } });
    }
    if (url.endsWith("/media")) {
      return Promise.resolve({ data: { objectKey: addedKey } });
    }
    return Promise.resolve({ data: {} });
  });
};

/** Creates a draft in the hook by calling onFilesAdded and waiting for it to settle. */
const createDraft = async (
  result: ReturnType<typeof renderHook<ReturnType<typeof useCreate>, unknown>>["result"],
  files: FileWithMetadata[],
) => {
  await act(async () => {
    result.current.onFilesAdded(files);
  });
  await waitFor(() => expect(result.current.isUploadingMedia).toBe(false));
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreate", () => {
  beforeEach(() => {
    mockClearServerError.mockReset();
    mockHandleServerError.mockReset();
    noopOnPostCreated.mockReset();
    mockPost.mockReset();
    mockDelete.mockReset();
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
      expect(result.current.onFilesAdded).toBeTypeOf("function");
      expect(result.current.onFileRemoved).toBeTypeOf("function");
      expect(result.current.discardDraft).toBeTypeOf("function");
    });

    it("isSubmitting and isUploadingMedia start as false", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isUploadingMedia).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // onFilesAdded — draft creation
  // -------------------------------------------------------------------------

  describe("onFilesAdded", () => {
    it("calls posts/draft with the files when no draft exists", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const file = makeFile();

      await act(async () => {
        result.current.onFilesAdded([file]);
      });

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "posts/draft",
          expect.any(FormData),
          expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } }),
        );
      });
    });

    it("does nothing when called with an empty array", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await act(async () => {
        result.current.onFilesAdded([]);
      });

      expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls posts/{id}/media for each file when draft already exists", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const firstFile = makeFile("first.jpg");
      const secondFile = makeFile("second.jpg");

      // Create the draft with the first batch.
      await createDraft(result, [firstFile]);

      // Add more files to the existing draft.
      await act(async () => {
        result.current.onFilesAdded([secondFile]);
      });

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          `posts/${DRAFT_POST_ID}/media`,
          expect.any(FormData),
          expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } }),
        );
      });
    });

    it("calls handleServerError when the draft creation API fails", async () => {
      mockPost.mockRejectedValueOnce(new Error("network error"));
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await act(async () => {
        result.current.onFilesAdded([makeFile()]);
      });

      await waitFor(() => expect(mockHandleServerError).toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // onFileRemoved
  // -------------------------------------------------------------------------

  describe("onFileRemoved", () => {
    it("calls DELETE posts/{id}/media with the correct objectKey", async () => {
      setupPostMock({ draftKeys: ["object-key-1"] });
      mockDelete.mockResolvedValue({});
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const file = makeFile();

      await createDraft(result, [file]);

      await act(async () => {
        result.current.onFileRemoved(file.id);
      });

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(
          `posts/${DRAFT_POST_ID}/media`,
          expect.objectContaining({ data: { objectKey: "object-key-1" } }),
        );
      });
    });

    it("does nothing when there is no active draft", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await act(async () => {
        result.current.onFileRemoved("any-id");
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("does nothing when the fileId has no matching objectKey", async () => {
      setupPostMock({ draftKeys: ["key1"] });
      mockDelete.mockResolvedValue({});
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await createDraft(result, [makeFile()]);

      await act(async () => {
        // "unknown-id" was never uploaded so there is no objectKey for it.
        result.current.onFileRemoved("unknown-id");
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // discardDraft
  // -------------------------------------------------------------------------

  describe("discardDraft", () => {
    it("calls DELETE posts/{id} when a draft exists", async () => {
      setupPostMock();
      mockDelete.mockResolvedValue({});
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      await createDraft(result, [makeFile()]);
      act(() => result.current.discardDraft());

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(`posts/${DRAFT_POST_ID}`);
      });
    });

    it("does nothing when there is no draft to discard", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.discardDraft());

      expect(mockDelete).not.toHaveBeenCalled();
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

    it("advances to step 1 when files are present regardless of upload state", async () => {
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

    it("does not call clearServerError when form fields are invalid", async () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      await setupAtStep1(result);

      await act(async () => {
        await result.current.handleNext([makeFile()], vi.fn());
      });

      expect(mockClearServerError).not.toHaveBeenCalled();
    });

    it("calls clearServerError when all required fields are valid", async () => {
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

      expect(mockClearServerError).toHaveBeenCalled();
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
    const validValues = {
      hobby: "Trading Cards",
      title: "My Item",
      description: "Some description here.",
      availableForTrade: false,
    };

    it("calls onFilesError and does not call the API when files array is empty", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit(validValues, [], onFilesError));

      expect(onFilesError).toHaveBeenCalledOnce();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls onFilesError when files are present but no draft exists", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit(validValues, [makeFile()], onFilesError));

      expect(onFilesError).toHaveBeenCalledOnce();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls clearServerError and publishes when draft exists", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();
      const file = makeFile();

      await createDraft(result, [file]);

      act(() => result.current.handleSubmit(validValues, [file], onFilesError));

      expect(onFilesError).not.toHaveBeenCalled();
      expect(mockClearServerError).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          `posts/${DRAFT_POST_ID}/publish`,
          expect.objectContaining({ title: validValues.title }),
        );
      });
    });

    it("calls onPostCreated with the published post id on success", async () => {
      setupPostMock({ publishedPostId: PUBLISHED_POST_ID });
      const onPostCreated = vi.fn();
      const { result } = renderHook(() => useCreate(onPostCreated), { wrapper: makeWrapper() });
      const file = makeFile();

      await createDraft(result, [file]);
      act(() => result.current.handleSubmit(validValues, [file], vi.fn()));

      await waitFor(() => expect(onPostCreated).toHaveBeenCalledWith(PUBLISHED_POST_ID));
    });

    it("calls handleServerError when the publish API fails", async () => {
      setupPostMock();
      mockPost.mockImplementationOnce(() => Promise.resolve({ data: { postId: DRAFT_POST_ID, mediaObjectKeys: ["k"] } }))
               .mockRejectedValueOnce(new Error("server error"));
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const file = makeFile();

      await createDraft(result, [file]);
      act(() => result.current.handleSubmit(validValues, [file], vi.fn()));

      await waitFor(() => expect(mockHandleServerError).toHaveBeenCalled());
    });

    it("includes optional lookingFor when provided", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const file = makeFile();

      await createDraft(result, [file]);

      expect(() => {
        act(() => {
          result.current.handleSubmit(
            { ...validValues, availableForTrade: true, lookingFor: "Baseball cards" },
            [file],
            vi.fn(),
          );
        });
      }).not.toThrow();
    });
  });
});
