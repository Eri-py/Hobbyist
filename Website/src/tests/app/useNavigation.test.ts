import { renderHook } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

import { useNavigation } from "@/hooks/app/useNavigation";
import { FeatureFlags } from "@hobbyist/types";

vi.mock("@tanstack/react-router", () => ({
  useLocation: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("@hobbyist/hooks", () => ({
  useAuth: vi.fn(),
  useFeatureFlags: vi.fn(),
}));

const mockHandleProfileClick = vi.fn();

vi.mock("@/hooks/profile/useProfile", () => ({
  useProfile: () => ({ handleProfileClick: mockHandleProfileClick }),
}));

import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, useFeatureFlags } from "@hobbyist/hooks";

const mockUseLocation = vi.mocked(useLocation);
const mockUseNavigate = vi.mocked(useNavigate);
const mockUseAuth = vi.mocked(useAuth);
const mockUseFeatureFlags = vi.mocked(useFeatureFlags);

const mockNavigate = vi.fn();

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
    mockNavigate.mockReset();
    mockHandleProfileClick.mockReset();

    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue(loggedInUser);

    mockUseFeatureFlags.mockReturnValue({
      [FeatureFlags.Trade]: true,
      [FeatureFlags.Events]: true,
      [FeatureFlags.Settings]: true,
      [FeatureFlags.Messages]: true,
    });
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

    it("settings page resolves to Settings", () => {
      // Arrange
      mockUseLocation.mockReturnValue({
        pathname: "/settings",
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

  describe("desktopItems", () => {
    it("includes Home, Trade, Events, and Settings when enabled", () => {
      mockUseLocation.mockReturnValue({ pathname: "/" } as ReturnType<typeof useLocation>);

      const { result } = renderHook(() => useNavigation());

      expect(result.current.desktopItems.map((item) => item.label)).toEqual([
        "Home",
        "Trade",
        "Events",
        "Settings",
      ]);
    });

    it("hides Settings when user is unauthenticated", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
      mockUseLocation.mockReturnValue({ pathname: "/" } as ReturnType<typeof useLocation>);

      const { result } = renderHook(() => useNavigation());

      expect(result.current.desktopItems.map((item) => item.label)).toEqual([
        "Home",
        "Trade",
        "Events",
      ]);
    });
  });

  describe("mobileItems", () => {
    it("includes expected labels when flags are enabled", () => {
      mockUseLocation.mockReturnValue({ pathname: "/" } as ReturnType<typeof useLocation>);

      const { result } = renderHook(() => useNavigation());

      expect(result.current.mobileItems.map((item) => item.label)).toEqual([
        "Home",
        "Events",
        "Create",
        "Messages",
        "Profile",
      ]);
    });

    it("messages handler navigates to /messages", () => {
      mockUseLocation.mockReturnValue({ pathname: "/" } as ReturnType<typeof useLocation>);

      const { result } = renderHook(() => useNavigation());
      const messagesItem = result.current.mobileItems.find((item) => item.key === "messages");

      expect(messagesItem).toBeDefined();
      messagesItem?.handleClick();

      expect(mockNavigate).toHaveBeenCalledWith({ to: "/messages" });
    });

    it("profile handler delegates to useProfile", () => {
      mockUseLocation.mockReturnValue({ pathname: "/" } as ReturnType<typeof useLocation>);

      const { result } = renderHook(() => useNavigation());
      const profileItem = result.current.mobileItems.find((item) => item.key === "profile");

      expect(profileItem).toBeDefined();
      profileItem?.handleClick();

      expect(mockHandleProfileClick).toHaveBeenCalledTimes(1);
    });
  });
});
