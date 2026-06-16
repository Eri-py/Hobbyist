import { vi, beforeEach, describe, it, expect } from "vitest";
import type { AxiosInstance } from "axios";

import type { components } from "@hobbyist/types";
import {
  createPostUploadResource,
  type CreatePostPayload,
} from "../../create/postUploadResource";

type PresignedUpload = components["schemas"]["PresignedUpload"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SLUG = "my-slug";

const mockPost = vi.fn();
const mockAxios = { post: mockPost } as unknown as AxiosInstance;

const resource = () => createPostUploadResource<File>(mockAxios);

const makeSources = (count: number): CreatePostPayload<File>["sources"] =>
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

const payload = (sources: CreatePostPayload<File>["sources"], publish: boolean): CreatePostPayload<File> => ({
  metadata: {
    hobby: "knitting",
    title: "My scarf",
    description: null,
    availableForTrade: false,
    lookingFor: null,
  },
  sources,
  publish,
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

describe("createPostUploadResource.init", () => {
  beforeEach(() => mockPost.mockReset());

  it("posts metadata + the derived manifest to posts/init and returns slug + uploads", async () => {
    mockPost.mockResolvedValue({ data: { slug: SLUG, uploads: makeUploads(2) } });

    const result = await resource().init(payload(makeSources(2), true));

    expect(mockPost).toHaveBeenCalledWith("posts/init", {
      hobby: "knitting",
      title: "My scarf",
      description: null,
      availableForTrade: false,
      lookingFor: null,
      media: [
        { position: 1, fileName: "f0.jpg", contentType: "image/jpeg", byteSize: 1 },
        { position: 2, fileName: "f1.jpg", contentType: "image/jpeg", byteSize: 2 },
      ],
    });
    expect(result).toEqual({ slug: SLUG, uploads: makeUploads(2) });
  });
});

// ---------------------------------------------------------------------------
// finalize
// ---------------------------------------------------------------------------

describe("createPostUploadResource.finalize", () => {
  beforeEach(() => mockPost.mockReset());

  it("posts publish intent to posts/{slug}/finalize", async () => {
    mockPost.mockResolvedValue({ data: { published: true, pendingUploads: [] } });

    await resource().finalize(SLUG, payload(makeSources(1), true));

    expect(mockPost).toHaveBeenCalledWith(`posts/${SLUG}/finalize`, { publish: true });
  });

  it("publish: done only when the server reports published", async () => {
    mockPost.mockResolvedValue({ data: { published: true, pendingUploads: [] } });
    expect((await resource().finalize(SLUG, payload(makeSources(1), true))).done).toBe(true);

    mockPost.mockResolvedValue({ data: { published: false, pendingUploads: makeUploads(1) } });
    const result = await resource().finalize(SLUG, payload(makeSources(1), true));
    expect(result.done).toBe(false);
    expect(result.pendingUploads).toEqual(makeUploads(1));
  });

  it("draft: done when zero pending, regardless of published flag", async () => {
    mockPost.mockResolvedValue({ data: { published: false, pendingUploads: [] } });
    expect((await resource().finalize(SLUG, payload(makeSources(1), false))).done).toBe(true);

    mockPost.mockResolvedValue({ data: { published: false, pendingUploads: makeUploads(1) } });
    expect((await resource().finalize(SLUG, payload(makeSources(1), false))).done).toBe(false);
  });
});
