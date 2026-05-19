import { renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const capturedMutations: Array<{ mutationFn: (formData: FormData) => Promise<any> }> = [];

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useMutation: vi.fn().mockImplementation((opts: any) => {
      capturedMutations.push(opts);
      return {
        mutateAsync: vi.fn((formData: FormData) => opts.mutationFn(formData)),
        isPending: false,
      };
    }),
  };
});

import {
  useCreatePost,
  appendPostFields,
  appendDraftFields,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILES,
} from "../../app/useCreatePost";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPost = vi.fn();
const mockAxios = { post: mockPost } as any;

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    // @ts-ignore — JSX in .ts is intentional for this test helper
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const makeFormData = () => new FormData();

const validValues = {
  hobby: "Trading Cards",
  title: "My Post",
  description: "A description here.",
  availableForTrade: false as boolean,
  lookingFor: undefined as string | undefined,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreatePost", () => {
  beforeEach(() => {
    capturedMutations.length = 0;
    mockPost.mockReset();
  });

  describe("initial state", () => {
    it("returns methods, createPost, saveDraft, and isSavingDraft", () => {
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });

      expect(result.current.methods).toBeDefined();
      expect(result.current.createPost).toBeTypeOf("function");
      expect(result.current.saveDraft).toBeTypeOf("function");
      expect(result.current.isSavingDraft).toBe(false);
    });
  });

  describe("createPost", () => {
    it("calls posts/create with the provided FormData", async () => {
      mockPost.mockResolvedValue({ data: { postId: "abc" } });
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });
      const formData = makeFormData();

      act(() => result.current.createPost(formData));

      await vi.waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith("posts/create", formData, { timeout: 60_000 });
      });
    });

    it("fires and forgets — does not throw on API failure", async () => {
      mockPost.mockRejectedValue(new Error("network error"));
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });

      expect(() => act(() => result.current.createPost(makeFormData()))).not.toThrow();
    });
  });

  describe("saveDraft", () => {
    it("calls posts/draft with the provided FormData", async () => {
      mockPost.mockResolvedValue({ data: { postId: "draft-abc" } });
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });
      const formData = makeFormData();

      await act(async () => {
        await result.current.saveDraft(formData);
      });

      expect(mockPost).toHaveBeenCalledWith("posts/draft", formData, { timeout: 60_000 });
    });

    it("resolves with the API response on success", async () => {
      mockPost.mockResolvedValue({ data: { postId: "draft-xyz" } });
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });

      let postId: string | undefined;
      await act(async () => {
        const response = await result.current.saveDraft(makeFormData());
        postId = response.data.postId;
      });

      expect(postId).toBe("draft-xyz");
    });

    it("rejects when the API fails", async () => {
      mockPost.mockRejectedValue(new Error("network error"));
      const { result } = renderHook(() => useCreatePost(mockAxios), { wrapper: makeWrapper() });

      let threw = false;
      await act(async () => {
        try {
          await result.current.saveDraft(makeFormData());
        } catch {
          threw = true;
        }
      });

      expect(threw).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// appendPostFields
// ---------------------------------------------------------------------------

describe("appendPostFields", () => {
  it("appends all required text fields", () => {
    const formData = new FormData();
    appendPostFields(formData, validValues);

    expect(formData.get("hobby")).toBe("Trading Cards");
    expect(formData.get("title")).toBe("My Post");
    expect(formData.get("description")).toBe("A description here.");
    expect(formData.get("availableForTrade")).toBe("false");
  });

  it("does not append lookingFor when it is undefined", () => {
    const formData = new FormData();
    appendPostFields(formData, { ...validValues, lookingFor: undefined });

    expect(formData.get("lookingFor")).toBeNull();
  });

  it("does not append lookingFor when it is an empty string", () => {
    const formData = new FormData();
    appendPostFields(formData, { ...validValues, lookingFor: "" });

    expect(formData.get("lookingFor")).toBeNull();
  });

  it("appends lookingFor when it has a value", () => {
    const formData = new FormData();
    appendPostFields(formData, { ...validValues, lookingFor: "vintage cards" });

    expect(formData.get("lookingFor")).toBe("vintage cards");
  });

  it("serialises availableForTrade as a string", () => {
    const formData = new FormData();
    appendPostFields(formData, { ...validValues, availableForTrade: true });

    expect(formData.get("availableForTrade")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// appendDraftFields
// ---------------------------------------------------------------------------

describe("appendDraftFields", () => {
  it("always appends availableForTrade", () => {
    const formData = new FormData();
    appendDraftFields(formData, { ...validValues, hobby: "", title: "", description: "" });

    expect(formData.get("availableForTrade")).toBe("false");
  });

  it("skips hobby, title, and description when they are empty strings", () => {
    const formData = new FormData();
    appendDraftFields(formData, { ...validValues, hobby: "", title: "", description: "" });

    expect(formData.get("hobby")).toBeNull();
    expect(formData.get("title")).toBeNull();
    expect(formData.get("description")).toBeNull();
  });

  it("appends hobby, title, and description when they are non-empty", () => {
    const formData = new FormData();
    appendDraftFields(formData, validValues);

    expect(formData.get("hobby")).toBe("Trading Cards");
    expect(formData.get("title")).toBe("My Post");
    expect(formData.get("description")).toBe("A description here.");
  });

  it("does not append lookingFor when it is undefined or empty", () => {
    const formData = new FormData();
    appendDraftFields(formData, { ...validValues, lookingFor: undefined });

    expect(formData.get("lookingFor")).toBeNull();
  });

  it("appends lookingFor when it has a value", () => {
    const formData = new FormData();
    appendDraftFields(formData, { ...validValues, lookingFor: "something rare" });

    expect(formData.get("lookingFor")).toBe("something rare");
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
