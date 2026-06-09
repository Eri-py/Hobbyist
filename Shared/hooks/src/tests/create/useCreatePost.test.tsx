import { renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import type { components } from "@hobbyist/types";
import {
  useCreatePost,
  buildManifest,
  type UploadSource,
  type UploadTransport,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILES,
} from "../../app/useCreatePost";

type PresignedUpload = components["schemas"]["PresignedUpload"];
type FinalizeResponse = components["schemas"]["FinalizeResponse"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPost = vi.fn();
const mockDelete = vi.fn();
const mockAxios = { post: mockPost, delete: mockDelete } as unknown as AxiosInstance;

const mockTransport = vi.fn<UploadTransport<File>>().mockResolvedValue(undefined);

const SLUG = "my-slug";

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const renderCreatePost = () =>
  renderHook(() => useCreatePost(mockAxios, mockTransport), { wrapper: makeWrapper() }).result;

const makeSources = (count: number): UploadSource<File>[] =>
  Array.from({ length: count }, (_, i) => ({
    file: new File(["x"], `f${i}.jpg`, { type: "image/jpeg" }),
    fileName: `f${i}.jpg`,
    contentType: "image/jpeg",
    byteSize: i + 1,
  }));

const makeUploads = (count: number): PresignedUpload[] =>
  Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    url: `https://storage.test/${i + 1}`,
    requiredHeaders: { "Content-Type": "image/jpeg" },
    expiresAt: "2026-01-01T00:00:00Z",
  }));

const PUBLISHED: FinalizeResponse = { published: true, pendingPositions: [] };
const PENDING: FinalizeResponse = { published: false, pendingPositions: [1] };

// Routes the shared `post` mock to init / init-draft / finalize by URL. The
// finalize sequence is consumed one entry per call (last entry repeats).
const wireApi = (opts: { uploads: PresignedUpload[]; finalize?: FinalizeResponse[] }) => {
  let finalizeCall = 0;
  mockPost.mockImplementation((url: string) => {
    if (url === "posts/init" || url === "posts/init-draft") {
      return Promise.resolve({ data: { slug: SLUG, uploads: opts.uploads } });
    }
    if (url.endsWith("/finalize")) {
      const seq = opts.finalize ?? [PUBLISHED];
      const result = seq[finalizeCall] ?? seq[seq.length - 1];
      finalizeCall += 1;
      return Promise.resolve({ data: result });
    }
    return Promise.reject(new Error(`unexpected post: ${url}`));
  });
};

const initCalls = () => mockPost.mock.calls.filter((call) => call[0] === "posts/init");
const finalizeCalls = () =>
  mockPost.mock.calls.filter((call) => String(call[0]).endsWith("/finalize"));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildManifest", () => {
  it("maps ordered sources to 1-based positions with their metadata", () => {
    const manifest = buildManifest(makeSources(3));

    expect(manifest).toEqual([
      { position: 1, fileName: "f0.jpg", contentType: "image/jpeg", byteSize: 1 },
      { position: 2, fileName: "f1.jpg", contentType: "image/jpeg", byteSize: 2 },
      { position: 3, fileName: "f2.jpg", contentType: "image/jpeg", byteSize: 3 },
    ]);
  });
});

describe("useCreatePost", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockDelete.mockReset().mockResolvedValue(undefined);
    mockTransport.mockReset().mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("returns methods, createPost, saveDraft, and isSavingDraft", () => {
      const result = renderCreatePost();

      expect(result.current.methods).toBeDefined();
      expect(result.current.createPost).toBeTypeOf("function");
      expect(result.current.saveDraft).toBeTypeOf("function");
      expect(result.current.isSavingDraft).toBe(false);
    });
  });

  describe("createPost (publish)", () => {
    it("inits, uploads every file, then finalizes", async () => {
      wireApi({ uploads: makeUploads(2) });
      const result = renderCreatePost();
      const sources = makeSources(2);

      act(() => result.current.createPost(sources));

      await vi.waitFor(() => expect(finalizeCalls()).toHaveLength(1));

      expect(initCalls()).toHaveLength(1);
      // Each file uploaded to its matching presigned target.
      expect(mockTransport).toHaveBeenCalledTimes(2);
      expect(mockTransport).toHaveBeenCalledWith({
        file: sources[0].file,
        upload: expect.objectContaining({ position: 1 }),
      });
      expect(mockTransport).toHaveBeenCalledWith({
        file: sources[1].file,
        upload: expect.objectContaining({ position: 2 }),
      });
      expect(finalizeCalls()[0][0]).toBe(`posts/${SLUG}/finalize`);
      // Clean publish leaves nothing to discard.
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("sends the manifest built from the sources in the init body", async () => {
      wireApi({ uploads: makeUploads(1) });
      const result = renderCreatePost();

      act(() => result.current.createPost(makeSources(1)));

      await vi.waitFor(() => expect(initCalls()).toHaveLength(1));
      expect(initCalls()[0][1]).toMatchObject({
        media: [{ position: 1, fileName: "f0.jpg", contentType: "image/jpeg", byteSize: 1 }],
      });
    });

    it("recreates when finalize reports the post is not yet published", async () => {
      wireApi({ uploads: makeUploads(1), finalize: [PENDING, PUBLISHED] });
      const result = renderCreatePost();

      act(() => result.current.createPost(makeSources(1)));

      // First attempt verified incomplete → discard, then a fresh init succeeds.
      await vi.waitFor(() => expect(initCalls()).toHaveLength(2));
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith(`posts/${SLUG}`);
      expect(finalizeCalls()).toHaveLength(2);
    });

    it("recreates when an upload fails mid-flight", async () => {
      wireApi({ uploads: makeUploads(1) });
      mockTransport.mockRejectedValueOnce(new Error("PUT failed")).mockResolvedValue(undefined);
      const result = renderCreatePost();

      act(() => result.current.createPost(makeSources(1)));

      await vi.waitFor(() => expect(initCalls()).toHaveLength(2));
      // The failed attempt is discarded; the retry uploads and finalizes once.
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledTimes(2);
      expect(finalizeCalls()).toHaveLength(1);
    });

    it("gives up after the attempt limit, discarding each orphan, without throwing", async () => {
      wireApi({ uploads: makeUploads(1), finalize: [PENDING] });
      const result = renderCreatePost();

      expect(() => act(() => result.current.createPost(makeSources(1)))).not.toThrow();

      await vi.waitFor(() => expect(initCalls()).toHaveLength(2));
      // Two attempts, each verified incomplete and discarded — never published.
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe("saveDraft (draft)", () => {
    it("inits a draft and uploads every file but never finalizes", async () => {
      wireApi({ uploads: makeUploads(2) });
      const result = renderCreatePost();
      const sources = makeSources(2);

      let slug: string | undefined;
      await act(async () => {
        slug = await result.current.saveDraft(sources);
      });

      expect(mockPost).toHaveBeenCalledWith("posts/init-draft", expect.anything());
      expect(mockTransport).toHaveBeenCalledTimes(2);
      expect(finalizeCalls()).toHaveLength(0);
      expect(mockDelete).not.toHaveBeenCalled();
      expect(slug).toBe(SLUG);
    });

    it("discards the partial draft and rejects when an upload fails", async () => {
      wireApi({ uploads: makeUploads(1) });
      mockTransport.mockRejectedValue(new Error("PUT failed"));
      const result = renderCreatePost();

      let threw = false;
      await act(async () => {
        try {
          await result.current.saveDraft(makeSources(1));
        } catch {
          threw = true;
        }
      });

      expect(threw).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(`posts/${SLUG}`);
    });
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("MAX_FILE_SIZE is 50 MB", () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });

  it("MAX_TOTAL_SIZE is 100 MB", () => {
    expect(MAX_TOTAL_SIZE).toBe(100 * 1024 * 1024);
  });

  it("MAX_FILES is 15", () => {
    expect(MAX_FILES).toBe(15);
  });
});
