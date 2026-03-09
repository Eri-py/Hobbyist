import { renderHook } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@hobbyist/hooks", () => ({
  useAuth: vi.fn(),
}));

// Import after vi.mock so we get the mocked version
import { useAuth } from "@hobbyist/hooks";

const mockUseAuth = vi.mocked(useAuth);

describe("useNavigationButtons", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "testuser",
        email: "test@example.com",
        firstname: "Test",
        lastname: "User",
      },
    });
  });

  it("handleCreateClick navigates to /create", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleCreateClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/create" });
  });

  it("handleMessagesClick navigates to /messages", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleMessagesClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/messages" });
  });

  it("handleHomeClick navigates to /", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleHomeClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("handleTradeClick navigates to /trade", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleTradeClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/trade" });
  });

  it("handleEventsClick navigates to /events", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleEventsClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/events" });
  });

  it("handleSettingsClick navigates to profile settings when user has a username", () => {
    // Arrange
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleSettingsClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile/testuser/settings" });
  });

  it("handleSettingsClick navigates to /profile when user is null", () => {
    // Arrange
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleSettingsClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
  });

  it("handleSettingsClick navigates to /profile when user has no username", () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "",
        email: "test@example.com",
        firstname: "Test",
        lastname: "User",
      },
    });
    const { result } = renderHook(() => useNavigationButtons());

    // Act
    result.current.handleSettingsClick();

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
  });
});
