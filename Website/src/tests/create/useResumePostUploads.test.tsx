import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

// Capture the config the post wrapper feeds into the generic sweep.
const { mockUseResumeUploads } = vi.hoisted(() => ({ mockUseResumeUploads: vi.fn() }));

vi.mock("@/hooks/upload/useResumeUploads", () => ({ useResumeUploads: mockUseResumeUploads }));
vi.mock("@/api/axiosInstance", () => ({ axiosInstance: { post: vi.fn() } }));
vi.mock("@/api/uploadToStorage", () => ({ uploadToStorage: vi.fn() }));

import { useResumePostUploads } from "@/hooks/create/useResumePostUploads";

describe("useResumePostUploads", () => {
  it("feeds the generic sweep a post engine and publish-aware labels", () => {
    renderHook(() => useResumePostUploads());

    expect(mockUseResumeUploads).toHaveBeenCalledTimes(1);
    const config = mockUseResumeUploads.mock.calls[0][0];

    // Labels branch on publish intent.
    expect(config.label({ publish: true })).toBe("Resuming your post");
    expect(config.label({ publish: false })).toBe("Resuming your draft");

    // buildEngine yields a usable engine (submit + resume).
    const engine = config.buildEngine();
    expect(engine.submit).toBeTypeOf("function");
    expect(engine.resume).toBeTypeOf("function");
  });
});
