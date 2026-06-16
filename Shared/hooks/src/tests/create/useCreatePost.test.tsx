import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import type { AxiosInstance } from "axios";

import { useCreatePost, type UploadSource, type UploadTransport } from "@hobbyist/hooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAxios = { post: vi.fn() } as unknown as AxiosInstance;
const mockTransport = vi.fn<UploadTransport<File>>().mockResolvedValue(undefined);

const renderCreatePost = () => renderHook(() => useCreatePost(mockAxios, mockTransport)).result;

const makeSources = (count: number): UploadSource<File>[] =>
  Array.from({ length: count }, (_, i) => ({
    file: new File(["x"], `f${i}.jpg`, { type: "image/jpeg" }),
    fileName: `f${i}.jpg`,
    contentType: "image/jpeg",
    byteSize: i + 1,
  }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreatePost", () => {
  it("exposes the form methods plus buildPayload and submit", () => {
    const result = renderCreatePost();

    expect(result.current.methods).toBeDefined();
    expect(result.current.buildPayload).toBeTypeOf("function");
    expect(result.current.submit).toBeTypeOf("function");
  });

  it("snapshots the live form into the payload metadata, empty fields as null", () => {
    const result = renderCreatePost();
    const sources = makeSources(2);

    act(() => {
      result.current.methods.setValue("hobby", "knitting");
      result.current.methods.setValue("title", "My scarf");
      result.current.methods.setValue("availableForTrade", true);
    });

    const built = result.current.buildPayload(sources, true);

    expect(built).toEqual({
      metadata: {
        hobby: "knitting",
        title: "My scarf",
        description: null,
        availableForTrade: true,
        lookingFor: null,
      },
      sources,
      publish: true,
    });
  });
});
