import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";

vi.mock("@mui/material/useMediaQuery", () => ({ default: vi.fn() }));

import useMediaQuery from "@mui/material/useMediaQuery";
import { CustomThemeProvider } from "@/providers/shared/CustomThemeProvider";
import { useThemeToggle } from "@/hooks/shared/useThemeToggle";

const mockUseMediaQuery = vi.mocked(useMediaQuery);

// ---------------------------------------------------------------------------
// localStorage stub — jsdom's localstorage is not fully implemented here
// ---------------------------------------------------------------------------
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
};

beforeAll(() =>
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
    writable: true,
  }),
);
afterAll(() => vi.unstubAllGlobals());

const wrapper = ({ children }: { children: ReactNode }) => (
  <CustomThemeProvider>{children}</CustomThemeProvider>
);

describe("CustomThemeProvider", () => {
  beforeEach(() => {
    delete store["currentThemeMode"];
    mockUseMediaQuery.mockReturnValue(false); // system prefers light by default
  });

  describe("mode initialisation", () => {
    it("defaults to light when localStorage is empty and system prefers light", () => {
      // Act
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Assert
      expect(result.current.mode).toBe("light");
    });

    it("defaults to dark when localStorage is empty and system prefers dark", () => {
      // Arrange
      mockUseMediaQuery.mockReturnValue(true);

      // Act
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Assert
      expect(result.current.mode).toBe("dark");
    });

    it("reads 'light' from localStorage, ignoring the system preference", () => {
      // Arrange
      localStorage.setItem("currentThemeMode", "light");
      mockUseMediaQuery.mockReturnValue(true); // system says dark, but localStorage wins

      // Act
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Assert
      expect(result.current.mode).toBe("light");
    });

    it("reads 'dark' from localStorage, ignoring the system preference", () => {
      // Arrange
      localStorage.setItem("currentThemeMode", "dark");

      // Act
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Assert
      expect(result.current.mode).toBe("dark");
    });

    it("ignores unsupported values in localStorage and falls back to system preference", () => {
      // Arrange
      localStorage.setItem("currentThemeMode", "invalid");
      mockUseMediaQuery.mockReturnValue(true); // system prefers dark

      // Act
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Assert
      expect(result.current.mode).toBe("dark");
    });
  });

  describe("toggleTheme", () => {
    it("switches from light to dark", () => {
      // Arrange
      const { result } = renderHook(() => useThemeToggle(), { wrapper });
      expect(result.current.mode).toBe("light");

      // Act
      act(() => result.current.toggleTheme());

      // Assert
      expect(result.current.mode).toBe("dark");
    });

    it("switches from dark to light", () => {
      // Arrange
      localStorage.setItem("currentThemeMode", "dark");
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Act
      act(() => result.current.toggleTheme());

      // Assert
      expect(result.current.mode).toBe("light");
    });

    it("persists the new mode to localStorage", () => {
      // Arrange
      const { result } = renderHook(() => useThemeToggle(), { wrapper });

      // Act / Assert
      act(() => result.current.toggleTheme());
      expect(localStorage.getItem("currentThemeMode")).toBe("dark");

      act(() => result.current.toggleTheme());
      expect(localStorage.getItem("currentThemeMode")).toBe("light");
    });
  });
});
