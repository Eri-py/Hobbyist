import { renderHook, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const {
  mockSubmit,
  mockResume,
  mockRun,
  mockListUploads,
  mockSaveUpload,
  mockDeleteUpload,
  authState,
} = vi.hoisted(() => ({
  mockSubmit: vi.fn(),
  mockResume: vi.fn(),
  mockRun: vi.fn(async (task: () => Promise<unknown>) => {
    try {
      return await task();
    } catch {
      return undefined;
    }
  }),
  mockListUploads: vi.fn(),
  mockSaveUpload: vi.fn(),
  mockDeleteUpload: vi.fn(),
  authState: { isAuthenticated: true },
}));

vi.mock("@hobbyist/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hobbyist/hooks")>();
  return {
    ...actual,
    createUploadEngine: () => ({ submit: mockSubmit, resume: mockResume }),
    useAuth: () => authState,
  };
});

vi.mock("@/hooks/app/useBackgroundTasks", () => ({
  useBackgroundTasks: () => ({ run: mockRun, pending: [], hasPending: false }),
}));

vi.mock("@/lib/uploadStore", () => ({
  listUploads: mockListUploads,
  saveUpload: mockSaveUpload,
  deleteUpload: mockDeleteUpload,
}));

vi.mock("@/api/axiosInstance", () => ({ axiosInstance: {} }));
vi.mock("@/api/uploadToStorage", () => ({ uploadToStorage: vi.fn() }));

import { useResumeUploads } from "@/hooks/upload/useResumeUploads";
import type { PersistedUpload } from "@/lib/uploadStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRecord = (over: Partial<PersistedUpload> = {}): PersistedUpload => ({
  id: "rec-1",
  createdAt: Date.now(),
  payload: {
    metadata: {
      hobby: null,
      title: null,
      description: null,
      availableForTrade: false,
      lookingFor: null,
    },
    sources: [],
    publish: true,
  },
  ...over,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useResumeUploads", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    mockSubmit.mockReset().mockResolvedValue(undefined);
    mockResume.mockReset().mockResolvedValue(undefined);
    mockListUploads.mockReset().mockResolvedValue([]);
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

  it("resumes a record that already has a slug, then clears it", async () => {
    mockListUploads.mockResolvedValue([makeRecord({ id: "a", slug: "slug-a" })]);

    renderHook(() => useResumeUploads());

    await waitFor(() =>
      expect(mockResume).toHaveBeenCalledWith(
        "slug-a",
        expect.objectContaining({ publish: true }),
        expect.any(Function),
      ),
    );
    expect(mockSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(mockDeleteUpload).toHaveBeenCalledWith("a"));
  });

  it("recreates a record that never got a slug", async () => {
    mockListUploads.mockResolvedValue([makeRecord({ id: "b" })]); // no slug

    renderHook(() => useResumeUploads());

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ publish: true }),
        expect.any(Function),
      ),
    );
    expect(mockResume).not.toHaveBeenCalled();
    await waitFor(() => expect(mockDeleteUpload).toHaveBeenCalledWith("b"));
  });

  it("drops a stale record without resuming it", async () => {
    const stale = makeRecord({ id: "old", createdAt: Date.now() - 2 * 60 * 60 * 1000 });
    mockListUploads.mockResolvedValue([stale]);

    renderHook(() => useResumeUploads());

    await waitFor(() => expect(mockDeleteUpload).toHaveBeenCalledWith("old"));
    expect(mockResume).not.toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("does nothing while unauthenticated", async () => {
    authState.isAuthenticated = false;
    mockListUploads.mockResolvedValue([makeRecord({ id: "a", slug: "slug-a" })]);

    renderHook(() => useResumeUploads());
    await Promise.resolve();

    expect(mockListUploads).not.toHaveBeenCalled();
    expect(mockRun).not.toHaveBeenCalled();
  });
});
