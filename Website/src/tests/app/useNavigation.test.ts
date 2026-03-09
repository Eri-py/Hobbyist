import { renderHook } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

import { useNavigation } from "@/hooks/app/useNavigation";

vi.mock("@tanstack/react-router", () => ({
  useLocation: vi.fn(),
}));

vi.mock("@hobbyist/hooks", () => ({
  useAuth: vi.fn(),
}));

import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@hobbyist/hooks";

const mockUseLocation = vi.mocked(useLocation);
const mockUseAuth = vi.mocked(useAuth);

// A logged-in user whose profile page we can navigate to
const loggedInUser = {
  isAuthenticated: true,
  user: {
    id: "1",
    username: "alice",
    email: "alice@example.com",
    firstname: "Alice",
    lastname: "Smith",
  },
};

describe("useNavigation", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(loggedInUser);
  });

  describe("activeTab resolution from static routes", () => {
    it.each([
      ["/", "Home"],
      ["/trade", "Trade"],
      ["/events", "Events"],
      ["/create", "Create"],
      ["/messages", "Messages"],
      ["/search", "Search"],
    ])("pathname %s maps to tab %s", (pathname, expectedTab) => {
      // Arrange
      mockUseLocation.mockReturnValue({ pathname } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe(expectedTab);
    });

    it("unknown pathname falls back to Home", () => {
      // Arrange
      mockUseLocation.mockReturnValue({
        pathname: "/unknown-page",
      } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe("Home");
    });
  });

  describe("activeTab resolution from profile routes", () => {
    it("own profile page resolves to Profile", () => {
      // Arrange
      mockUseLocation.mockReturnValue({
        pathname: "/profile/alice",
      } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe("Profile");
    });

    it("own settings page resolves to Settings", () => {
      // Arrange
      mockUseLocation.mockReturnValue({
        pathname: "/profile/alice/settings",
      } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe("Settings");
    });

    it("another user's profile page falls back to Home when no route match", () => {
      // Arrange
      mockUseLocation.mockReturnValue({
        pathname: "/profile/bob",
      } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe("Home");
    });

    it("profile route without a logged-in user falls back to Home", () => {
      // Arrange
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
      mockUseLocation.mockReturnValue({
        pathname: "/profile/alice",
      } as ReturnType<typeof useLocation>);

      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.activeTab).toBe("Home");
    });
  });

  describe("getActiveTab", () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ pathname: "/trade" } as ReturnType<typeof useLocation>);
    });

    it("returns true for the matching tab label", () => {
      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.getActiveTab("Trade")).toBe(true);
    });

    it("returns false for a non-matching tab label", () => {
      // Act
      const { result } = renderHook(() => useNavigation());

      // Assert
      expect(result.current.getActiveTab("Home")).toBe(false);
    });
  });
});
