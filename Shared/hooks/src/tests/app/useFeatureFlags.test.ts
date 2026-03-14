import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { createElement, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Module mocks — declared before the imports they affect
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";
import {
  useFeatureFlags,
  useFeatureFlagsProvider,
  FeatureFlagsContext,
} from "../../app/useFeatureFlags";

const mockUseQuery = vi.mocked(useQuery);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFeatureFlags", () => {
  describe("when called outside a FeatureFlagsContext.Provider", () => {
    it("throws an error with a descriptive message", () => {
      // Arrange — suppress React's console.error for this expected throw
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Act & Assert
      expect(() => renderHook(() => useFeatureFlags())).toThrow(
        "useFeatureFlags must be used within a FeatureFlagsProvider.",
      );

      spy.mockRestore();
    });
  });

  describe("when called inside a FeatureFlagsContext.Provider", () => {
    it("returns the feature flags map from context", () => {
      // Arrange
      const flags = { darkMode: true, betaAccess: false };
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(FeatureFlagsContext.Provider, { value: flags }, children);

      // Act
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      // Assert
      expect(result.current).toEqual(flags);
    });

    it("returns an empty map when no flags are enabled", () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(FeatureFlagsContext.Provider, { value: {} }, children);

      // Act
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      // Assert
      expect(result.current).toEqual({});
    });
  });
});

describe("useFeatureFlagsProvider", () => {
  const mockAxios = { get: vi.fn() } as any;

  it("returns isPending true while the query is loading", () => {
    // Arrange
    mockUseQuery.mockReturnValue({ data: undefined, isPending: true } as any);

    // Act
    const { result } = renderHook(() => useFeatureFlagsProvider(mockAxios));

    // Assert
    expect(result.current.isPending).toBe(true);
  });

  it("returns an empty flags map while the query is loading", () => {
    // Arrange
    mockUseQuery.mockReturnValue({ data: undefined, isPending: true } as any);

    // Act
    const { result } = renderHook(() => useFeatureFlagsProvider(mockAxios));

    // Assert
    expect(result.current.value).toEqual({});
  });

  it("returns isPending false when loaded", () => {
    // Arrange
    const flags = { newUI: true, analytics: false };
    mockUseQuery.mockReturnValue({ data: flags, isPending: false } as any);

    // Act
    const { result } = renderHook(() => useFeatureFlagsProvider(mockAxios));

    // Assert
    expect(result.current.isPending).toBe(false);
  });

  it("returns the flags from the query response when loaded", () => {
    // Arrange
    const flags = { newUI: true, analytics: false };
    mockUseQuery.mockReturnValue({ data: flags, isPending: false } as any);

    // Act
    const { result } = renderHook(() => useFeatureFlagsProvider(mockAxios));

    // Assert
    expect(result.current.value).toEqual(flags);
  });

  it("falls back to an empty map when query data is undefined", () => {
    // Arrange
    mockUseQuery.mockReturnValue({ data: undefined, isPending: false } as any);

    // Act
    const { result } = renderHook(() => useFeatureFlagsProvider(mockAxios));

    // Assert
    expect(result.current.value).toEqual({});
  });
});
