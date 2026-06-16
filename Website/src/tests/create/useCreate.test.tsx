import { type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { mockPost, mockDelete, mockUploadToStorage, mockRun, mockSaveUpload, mockDeleteUpload } =
  vi.hoisted(() => {
    // Swallows after running the task, mirroring the real run() (it notifies + swallows on failure),
    // so a voided dispatch can't raise an unhandled rejection in tests.
    const run = vi.fn(async (task: () => Promise<unknown>) => {
      try {
        return await task();
      } catch {
        return undefined;
      }
    });
    return {
      mockPost: vi.fn(),
      mockDelete: vi.fn(),
      mockUploadToStorage: vi.fn(),
      mockRun: run,
      mockSaveUpload: vi.fn(),
      mockDeleteUpload: vi.fn(),
    };
  });

vi.mock("@/api/axiosInstance", () => ({
  axiosInstance: { post: mockPost, delete: mockDelete },
}));

vi.mock("@/api/uploadToStorage", () => ({
  uploadToStorage: mockUploadToStorage,
}));

vi.mock("@/hooks/app/useBackgroundTasks", () => ({
  useBackgroundTasks: () => ({ run: mockRun, pending: [], hasPending: false }),
}));

vi.mock("@/lib/uploadStore", () => ({
  saveUpload: mockSaveUpload,
  deleteUpload: mockDeleteUpload,
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

const SLUG = "my-post-slug";

// Routes init / finalize through the shared axios mock. One upload target per file (tests use a
// single file), and finalize publishes cleanly.
const setupPostMock = () => {
  mockPost.mockImplementation((url: string) => {
    if (url === "posts/init") {
      return Promise.resolve({
        data: {
          slug: SLUG,
          uploads: [
            { position: 1, url: "https://storage.test/1", requiredHeaders: {}, expiresAt: "" },
          ],
        },
      });
    }
    if (url.endsWith("/finalize")) {
      return Promise.resolve({ data: { published: true, pendingUploads: [] } });
    }
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
    mockDelete.mockReset().mockResolvedValue(undefined);
    mockUploadToStorage.mockReset().mockResolvedValue(undefined);
    mockSaveUpload.mockReset().mockResolvedValue(undefined);
    mockDeleteUpload.mockReset().mockResolvedValue(undefined);
    mockRun.mockReset().mockImplementation(async (task: () => Promise<unknown>) => {
      try {
        return await task();
      } catch {
        return undefined;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it("starts at step 0", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.activeStep).toBe(0);
    });

    it("exposes all required callbacks", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      expect(result.current.methods).toBeDefined();
      expect(result.current.handleNext).toBeTypeOf("function");
      expect(result.current.handleBack).toBeTypeOf("function");
      expect(result.current.handleSubmit).toBeTypeOf("function");
      expect(result.current.saveDraft).toBeTypeOf("function");
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
  // handleSubmit (publish)
  // -------------------------------------------------------------------------

  describe("handleSubmit", () => {
    it("calls onFilesError and dispatches nothing when files array is empty", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit([], onFilesError));

      expect(onFilesError).toHaveBeenCalledOnce();
      expect(mockRun).not.toHaveBeenCalled();
      expect(mockSaveUpload).not.toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("dispatches a publish through run, then inits/uploads/finalizes", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });
      const onFilesError = vi.fn();

      act(() => result.current.handleSubmit([makeFile()], onFilesError));

      expect(onFilesError).not.toHaveBeenCalled();
      // The work is dispatched through the background-task runner with a publish label.
      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(mockRun).toHaveBeenCalledWith(expect.any(Function), { label: "Publishing your post" });

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "posts/init",
          expect.objectContaining({
            media: [expect.objectContaining({ position: 1, fileName: "photo.jpg" })],
          }),
        );
      });
      await waitFor(() => expect(mockUploadToStorage).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith(`posts/${SLUG}/finalize`, { publish: true }),
      );
    });

    it("calls onPostCreated immediately without waiting for the upload", () => {
      setupPostMock();
      const onPostCreated = vi.fn();
      const { result } = renderHook(() => useCreate(onPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.handleSubmit([makeFile()], vi.fn()));

      expect(onPostCreated).toHaveBeenCalledOnce();
      expect(onPostCreated).toHaveBeenCalledWith();
    });

    it("persists the payload before uploading and clears it once published", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.handleSubmit([makeFile()], vi.fn()));

      // Snapshot saved up front with the publish payload...
      await waitFor(() => expect(mockSaveUpload).toHaveBeenCalledTimes(1));
      const record = mockSaveUpload.mock.calls[0][0];
      expect(record).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Number),
        payload: expect.objectContaining({ publish: true }),
      });
      // ...then removed once finalize publishes, keyed by the same id.
      await waitFor(() => expect(mockDeleteUpload).toHaveBeenCalledWith(record.id));
    });

    it("does not throw on upload error, and keeps the persisted snapshot for resume", async () => {
      mockPost.mockRejectedValue(new Error("server error"));
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      expect(() => act(() => result.current.handleSubmit([makeFile()], vi.fn()))).not.toThrow();

      // Snapshot persisted but never deleted — so resume-on-load can retry it.
      await waitFor(() => expect(mockSaveUpload).toHaveBeenCalled());
      await waitFor(() => expect(mockPost).toHaveBeenCalled());
      expect(mockDeleteUpload).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // saveDraft
  // -------------------------------------------------------------------------

  describe("saveDraft", () => {
    it("dispatches a draft through run, then inits/uploads/finalizes with publish:false", async () => {
      setupPostMock();
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.saveDraft([makeFile()]));

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(mockRun).toHaveBeenCalledWith(expect.any(Function), { label: "Saving your draft" });

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("posts/init", expect.anything()));
      await waitFor(() => expect(mockUploadToStorage).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith(`posts/${SLUG}/finalize`, { publish: false }),
      );
    });

    it("does not navigate (no onPostCreated) — the caller proceeds itself", () => {
      setupPostMock();
      const onPostCreated = vi.fn();
      const { result } = renderHook(() => useCreate(onPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.saveDraft([makeFile()]));

      expect(onPostCreated).not.toHaveBeenCalled();
    });

    it("dispatches nothing for an empty set — a draft is still media-first", () => {
      const { result } = renderHook(() => useCreate(noopOnPostCreated), { wrapper: makeWrapper() });

      act(() => result.current.saveDraft([]));

      expect(mockRun).not.toHaveBeenCalled();
      expect(mockSaveUpload).not.toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});
