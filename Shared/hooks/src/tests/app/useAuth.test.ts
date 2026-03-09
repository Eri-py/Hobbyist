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
import { useAuth, useAuthProvider, AuthContext } from "../../app/useAuth";

const mockUseQuery = vi.mocked(useQuery);

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const mockUser = {
  id: "1",
  username: "alice",
  email: "alice@example.com",
  firstname: "Alice",
  lastname: "Smith",
};

const authenticatedValue = { isAuthenticated: true, user: mockUser };
const unauthenticatedValue = { isAuthenticated: false, user: null };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAuth", () => {
  describe("when called outside an AuthContext.Provider", () => {
    it("throws an error with a descriptive message", () => {
      // Arrange — suppress React's console.error for this expected throw
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Act & Assert
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used within an AuthProvider.",
      );

      spy.mockRestore();
    });
  });

  describe("when called inside an AuthContext.Provider", () => {
    it("returns the authenticated context value", () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(AuthContext.Provider, { value: authenticatedValue }, children);

      // Act
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it("returns the unauthenticated context value", () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(AuthContext.Provider, { value: unauthenticatedValue }, children);

      // Act
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});

describe("useAuthProvider", () => {
  const mockAxios = { get: vi.fn() } as any;

  it("returns isPending true and default empty value while the query is loading", () => {
    // Arrange
    mockUseQuery.mockReturnValue({ data: undefined, isPending: true } as any);

    // Act
    const { result } = renderHook(() => useAuthProvider(mockAxios));

    // Assert
    expect(result.current.isPending).toBe(true);
    expect(result.current.value.isAuthenticated).toBe(false);
    expect(result.current.value.user).toBeNull();
  });

  it("returns the authenticated value from the query response", () => {
    // Arrange
    mockUseQuery.mockReturnValue({
      data: { data: { isAuthenticated: true, user: mockUser } },
      isPending: false,
    } as any);

    // Act
    const { result } = renderHook(() => useAuthProvider(mockAxios));

    // Assert
    expect(result.current.isPending).toBe(false);
    expect(result.current.value.isAuthenticated).toBe(true);
    expect(result.current.value.user).toEqual(mockUser);
  });

  it("returns isAuthenticated false and no user when response indicates unauthenticated", () => {
    // Arrange
    mockUseQuery.mockReturnValue({
      data: { data: { isAuthenticated: false, user: null } },
      isPending: false,
    } as any);

    // Act
    const { result } = renderHook(() => useAuthProvider(mockAxios));

    // Assert
    expect(result.current.value.isAuthenticated).toBe(false);
    expect(result.current.value.user).toBeNull();
  });
});
