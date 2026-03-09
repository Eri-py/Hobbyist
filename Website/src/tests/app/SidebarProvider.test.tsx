import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";

import { SidebarProvider } from "@/providers/app/SidebarProvider";
import { useSidebar } from "@/hooks/app/useSidebar";

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
  <SidebarProvider>{children}</SidebarProvider>
);

describe("SidebarProvider", () => {
  beforeEach(() => delete store["sidebarOpen"]);

  describe("initialisation", () => {
    it("defaults to open when localStorage has no saved value", () => {
      // Act
      const { result } = renderHook(() => useSidebar(), { wrapper });

      // Assert
      expect(result.current.isSidebarOpen).toBe(true);
    });

    it("opens the sidebar when localStorage contains 'true'", () => {
      // Arrange
      localStorage.setItem("sidebarOpen", "true");

      // Act
      const { result } = renderHook(() => useSidebar(), { wrapper });

      // Assert
      expect(result.current.isSidebarOpen).toBe(true);
    });

    it("closes the sidebar when localStorage contains 'false'", () => {
      // Arrange
      localStorage.setItem("sidebarOpen", "false");

      // Act
      const { result } = renderHook(() => useSidebar(), { wrapper });

      // Assert
      expect(result.current.isSidebarOpen).toBe(false);
    });
  });

  describe("toggleSidebar", () => {
    it("flips the state from open to closed and back", () => {
      // Arrange
      const { result } = renderHook(() => useSidebar(), { wrapper });
      expect(result.current.isSidebarOpen).toBe(true);

      // Act / Assert
      act(() => result.current.toggleSidebar());
      expect(result.current.isSidebarOpen).toBe(false);

      act(() => result.current.toggleSidebar());
      expect(result.current.isSidebarOpen).toBe(true);
    });

    it("persists the new state to localStorage on each toggle", () => {
      // Arrange
      const { result } = renderHook(() => useSidebar(), { wrapper });

      // Act / Assert
      act(() => result.current.toggleSidebar());
      expect(localStorage.getItem("sidebarOpen")).toBe("false");

      act(() => result.current.toggleSidebar());
      expect(localStorage.getItem("sidebarOpen")).toBe("true");
    });
  });
});
