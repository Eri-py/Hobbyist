import { vi, beforeEach, describe, it, expect } from "vitest";

import type { components } from "@hobbyist/types";
import {
  createUploadEngine,
  buildManifest,
  type UploadSource,
  type UploadTransport,
  type UploadResource,
  type UploadPayloadBase,
  type InitResult,
  type FinalizeResult,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILES,
} from "../../upload/uploadEngine";

type PresignedUpload = components["schemas"]["PresignedUpload"];
type TestPayload = UploadPayloadBase<File>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SLUG = "my-slug";

const mockTransport = vi.fn<UploadTransport<File>>().mockResolvedValue(undefined);

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

const done = (): FinalizeResult => ({ done: true, pendingUploads: [] });
// Finalize reporting incomplete: each pending position comes back with a fresh re-signed target.
const pending = (positions: number[]): FinalizeResult => ({
  done: false,
  pendingUploads: positions.map((p) => ({
    position: p,
    url: `https://storage.test/resign/${p}`,
    requiredHeaders: { "Content-Type": "image/jpeg" },
    expiresAt: "2026-01-01T00:00:00Z",
  })),
});

// An axios-shaped 404 (a session the server GC reclaimed).
const axios404 = () =>
  Object.assign(new Error("not found"), { isAxiosError: true, response: { status: 404 } });

// A mock resource: init yields the slug + targets; finalize is consumed one entry per call (last
// entry repeats). An Error entry rejects (e.g. a 404).
const makeResource = (opts: { uploads?: PresignedUpload[]; finalize?: (FinalizeResult | Error)[] }) => {
  let finalizeCall = 0;
  const resource: UploadResource<TestPayload> = {
    init: vi.fn(async (): Promise<InitResult> => ({ slug: SLUG, uploads: opts.uploads ?? [] })),
    finalize: vi.fn(async (): Promise<FinalizeResult> => {
      const seq = opts.finalize ?? [done()];
      const result = seq[finalizeCall] ?? seq[seq.length - 1];
      finalizeCall += 1;
      if (result instanceof Error) throw result;
      return result;
    }),
  };
  return resource;
};

const payload = (sources: UploadSource<File>[]): TestPayload => ({ sources });

const uploadedPositions = () => mockTransport.mock.calls.map((call) => call[0].upload.position);

// ---------------------------------------------------------------------------
// buildManifest
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

// ---------------------------------------------------------------------------
// createUploadEngine
// ---------------------------------------------------------------------------

describe("createUploadEngine", () => {
  beforeEach(() => {
    mockTransport.mockReset().mockResolvedValue(undefined);
  });

  describe("submit", () => {
    it("inits, hands the slug to onSlug, uploads every file, then finalizes", async () => {
      const resource = makeResource({ uploads: makeUploads(2) });
      const { submit } = createUploadEngine(resource, mockTransport);
      const onSlug = vi.fn();

      await submit(payload(makeSources(2)), onSlug);

      expect(resource.init).toHaveBeenCalledTimes(1);
      expect(onSlug).toHaveBeenCalledWith(SLUG);
      expect(uploadedPositions()).toEqual([1, 2]);
      expect(resource.finalize).toHaveBeenCalledTimes(1);
    });

    it("re-uploads only the still-pending files on retry, without re-initing", async () => {
      const resource = makeResource({ uploads: makeUploads(2), finalize: [pending([2]), done()] });
      const { submit } = createUploadEngine(resource, mockTransport);

      await submit(payload(makeSources(2)));

      // One session; position 2 re-uploaded after finalize reported it missing, position 1 left alone.
      expect(resource.init).toHaveBeenCalledTimes(1);
      expect(uploadedPositions()).toEqual([1, 2, 2]);
      expect(resource.finalize).toHaveBeenCalledTimes(2);
    });

    it("rejects after the attempt limit when a file never lands, leaving the orphan", async () => {
      const resource = makeResource({ uploads: makeUploads(1), finalize: [pending([1])] });
      const { submit } = createUploadEngine(resource, mockTransport);

      await expect(submit(payload(makeSources(1)))).rejects.toThrow();

      // Init once (no recreate), finalize once per attempt; the orphan is left for the server GC.
      expect(resource.init).toHaveBeenCalledTimes(1);
      expect(resource.finalize).toHaveBeenCalledTimes(2);
    });
  });

  describe("resume", () => {
    it("skips init and re-uploads only what finalize reports missing", async () => {
      const resource = makeResource({ finalize: [pending([1, 2]), done()] });
      const { resume } = createUploadEngine(resource, mockTransport);

      await resume(SLUG, payload(makeSources(2)));

      expect(resource.init).not.toHaveBeenCalled();
      expect(uploadedPositions()).toEqual([1, 2]);
      expect(resource.finalize).toHaveBeenCalledTimes(2);
    });

    it("returns immediately when the session is already complete", async () => {
      const resource = makeResource({ finalize: [done()] });
      const { resume } = createUploadEngine(resource, mockTransport);

      await resume(SLUG, payload(makeSources(1)));

      expect(resource.init).not.toHaveBeenCalled();
      expect(mockTransport).not.toHaveBeenCalled();
      expect(resource.finalize).toHaveBeenCalledTimes(1);
    });

    it("recreates from scratch when the session is gone (404)", async () => {
      const resource = makeResource({ uploads: makeUploads(1), finalize: [axios404(), done()] });
      const { resume } = createUploadEngine(resource, mockTransport);
      const onSlug = vi.fn();

      await resume(SLUG, payload(makeSources(1)), onSlug);

      // The probe 404s, so it falls back to a fresh init + upload + finalize.
      expect(resource.init).toHaveBeenCalledTimes(1);
      expect(onSlug).toHaveBeenCalledWith(SLUG);
      expect(uploadedPositions()).toEqual([1]);
    });

    it("rethrows a non-404 finalize error without recreating", async () => {
      const resource = makeResource({ finalize: [new Error("boom")] });
      const { resume } = createUploadEngine(resource, mockTransport);

      await expect(resume(SLUG, payload(makeSources(1)))).rejects.toThrow("boom");
      expect(resource.init).not.toHaveBeenCalled();
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
