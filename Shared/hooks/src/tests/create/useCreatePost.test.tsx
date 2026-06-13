import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
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
} from "../../create/useCreatePost";

type PresignedUpload = components["schemas"]["PresignedUpload"];
type FinalizeResponse = components["schemas"]["FinalizeResponse"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPost = vi.fn();
const mockAxios = { post: mockPost } as unknown as AxiosInstance;

const mockTransport = vi.fn<UploadTransport<File>>().mockResolvedValue(undefined);

const SLUG = "my-slug";

const renderCreatePost = () => renderHook(() => useCreatePost(mockAxios, mockTransport)).result;

type Result = ReturnType<typeof renderCreatePost>;

const submit = (result: Result, sources: UploadSource<File>[], publish: boolean, onSlug?: (s: string) => void) =>
  result.current.submit(result.current.buildPayload(sources, publish), onSlug);

const resume = (
  result: Result,
  slug: string,
  sources: UploadSource<File>[],
  publish: boolean,
  onSlug?: (s: string) => void,
) => result.current.resume(slug, result.current.buildPayload(sources, publish), onSlug);

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

const published = (): FinalizeResponse => ({ published: true, pendingUploads: [] });
// A draft finalize verifies the bytes but stays Draft.
const draftOk = (): FinalizeResponse => ({ published: false, pendingUploads: [] });
// Finalize reporting incomplete: each pending position comes back with a fresh re-signed target.
const pending = (positions: number[]): FinalizeResponse => ({
  published: false,
  pendingUploads: positions.map((p) => ({
    position: p,
    url: `https://storage.test/resign/${p}`,
    requiredHeaders: { "Content-Type": "image/jpeg" },
    expiresAt: "2026-01-01T00:00:00Z",
  })),
});

// An axios-shaped 404 (a post the server GC reclaimed).
const axios404 = () =>
  Object.assign(new Error("not found"), { isAxiosError: true, response: { status: 404 } });

// Routes the shared `post` mock to init / finalize by URL. The finalize sequence is consumed one
// entry per call (last entry repeats); an Error entry rejects (e.g. a 404).
const wireApi = (opts: { uploads?: PresignedUpload[]; finalize?: (FinalizeResponse | Error)[] }) => {
  let finalizeCall = 0;
  mockPost.mockImplementation((url: string) => {
    if (url === "posts/init") {
      return Promise.resolve({ data: { slug: SLUG, uploads: opts.uploads ?? [] } });
    }
    if (url.endsWith("/finalize")) {
      const seq = opts.finalize ?? [published()];
      const result = seq[finalizeCall] ?? seq[seq.length - 1];
      finalizeCall += 1;
      return result instanceof Error ? Promise.reject(result) : Promise.resolve({ data: result });
    }
    return Promise.reject(new Error(`unexpected post: ${url}`));
  });
};

const initCalls = () => mockPost.mock.calls.filter((call) => call[0] === "posts/init");
const finalizeCalls = () =>
  mockPost.mock.calls.filter((call) => String(call[0]).endsWith("/finalize"));
const uploadedPositions = () => mockTransport.mock.calls.map((call) => call[0].upload.position);

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
    mockTransport.mockReset().mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("returns methods, buildPayload, submit, and resume", () => {
      const result = renderCreatePost();

      expect(result.current.methods).toBeDefined();
      expect(result.current.buildPayload).toBeTypeOf("function");
      expect(result.current.submit).toBeTypeOf("function");
      expect(result.current.resume).toBeTypeOf("function");
    });
  });

  describe("submit (publish)", () => {
    it("inits, uploads every file, then finalizes with publish:true", async () => {
      wireApi({ uploads: makeUploads(2) });
      const result = renderCreatePost();

      await act(async () => {
        await submit(result, makeSources(2), true);
      });

      expect(initCalls()).toHaveLength(1);
      expect(uploadedPositions()).toEqual([1, 2]);
      expect(finalizeCalls()).toHaveLength(1);
      expect(finalizeCalls()[0][1]).toEqual({ publish: true });
    });

    it("sends the manifest built from the sources in the init body", async () => {
      wireApi({ uploads: makeUploads(1) });
      const result = renderCreatePost();

      await act(async () => {
        await submit(result, makeSources(1), true);
      });

      expect(initCalls()[0][1]).toMatchObject({
        media: [{ position: 1, fileName: "f0.jpg", contentType: "image/jpeg", byteSize: 1 }],
      });
    });

    it("hands the slug to onSlug once the post exists", async () => {
      wireApi({ uploads: makeUploads(1) });
      const result = renderCreatePost();
      const onSlug = vi.fn();

      await act(async () => {
        await submit(result, makeSources(1), true, onSlug);
      });

      expect(onSlug).toHaveBeenCalledWith(SLUG);
    });

    it("re-uploads only the still-pending files on retry, without re-initing", async () => {
      wireApi({ uploads: makeUploads(2), finalize: [pending([2]), published()] });
      const result = renderCreatePost();

      await act(async () => {
        await submit(result, makeSources(2), true);
      });

      // One post; position 2 re-uploaded after finalize reported it missing, position 1 left alone.
      expect(initCalls()).toHaveLength(1);
      expect(uploadedPositions()).toEqual([1, 2, 2]);
      expect(finalizeCalls()).toHaveLength(2);
    });

    it("rejects after the attempt limit when a file never lands", async () => {
      wireApi({ uploads: makeUploads(1), finalize: [pending([1])] });
      const result = renderCreatePost();

      let threw = false;
      await act(async () => {
        try {
          await submit(result, makeSources(1), true);
        } catch {
          threw = true;
        }
      });

      expect(threw).toBe(true);
      // Init once (no recreate), finalize once per attempt; the orphan is left for the server GC.
      expect(initCalls()).toHaveLength(1);
      expect(finalizeCalls()).toHaveLength(2);
    });
  });

  describe("submit (draft)", () => {
    it("finalizes as a draft (publish:false) and resolves once verified", async () => {
      wireApi({ uploads: makeUploads(2), finalize: [draftOk()] });
      const result = renderCreatePost();

      await act(async () => {
        await submit(result, makeSources(2), false);
      });

      expect(uploadedPositions()).toEqual([1, 2]);
      expect(finalizeCalls()).toHaveLength(1);
      expect(finalizeCalls()[0][1]).toEqual({ publish: false });
    });

    it("rejects when a draft file never finishes uploading", async () => {
      wireApi({ uploads: makeUploads(1), finalize: [pending([1])] });
      const result = renderCreatePost();

      let threw = false;
      await act(async () => {
        try {
          await submit(result, makeSources(1), false);
        } catch {
          threw = true;
        }
      });

      expect(threw).toBe(true);
    });
  });

  describe("resume", () => {
    it("skips init and re-uploads only what finalize reports missing", async () => {
      wireApi({ finalize: [pending([1, 2]), published()] });
      const result = renderCreatePost();

      await act(async () => {
        await resume(result, SLUG, makeSources(2), true);
      });

      // No new post — it picks up the existing one and uploads the gaps.
      expect(initCalls()).toHaveLength(0);
      expect(uploadedPositions()).toEqual([1, 2]);
      expect(finalizeCalls()).toHaveLength(2);
    });

    it("returns immediately when the post is already complete", async () => {
      wireApi({ finalize: [published()] });
      const result = renderCreatePost();

      await act(async () => {
        await resume(result, SLUG, makeSources(1), true);
      });

      expect(initCalls()).toHaveLength(0);
      expect(mockTransport).not.toHaveBeenCalled();
      expect(finalizeCalls()).toHaveLength(1);
    });

    it("recreates from scratch when the post is gone (404)", async () => {
      wireApi({ uploads: makeUploads(1), finalize: [axios404(), published()] });
      const result = renderCreatePost();
      const onSlug = vi.fn();

      await act(async () => {
        await resume(result, SLUG, makeSources(1), true, onSlug);
      });

      // The probe 404s, so it falls back to a fresh init + upload + finalize.
      expect(initCalls()).toHaveLength(1);
      expect(onSlug).toHaveBeenCalledWith(SLUG);
      expect(uploadedPositions()).toEqual([1]);
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
