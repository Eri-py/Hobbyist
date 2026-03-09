import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@mui/material/useMediaQuery", () => ({ default: vi.fn() }));

import useMediaQuery from "@mui/material/useMediaQuery";
import { BreakpointProvider } from "@/providers/shared/BreakpointProvider";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

const mockUseMediaQuery = vi.mocked(useMediaQuery);

const wrapper = ({ children }: { children: ReactNode }) => (
  <BreakpointProvider>{children}</BreakpointProvider>
);

describe("BreakpointProvider", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReset();
  });

  it("exposes isDesktop=true when the media query matches", () => {
    // Arrange
    mockUseMediaQuery.mockReturnValue(true);

    // Act
    const { result } = renderHook(() => useDeviceType(), { wrapper });

    // Assert
    expect(result.current.isDesktop).toBe(true);
  });

  it("exposes isDesktop=false when the media query does not match", () => {
    // Arrange
    mockUseMediaQuery.mockReturnValue(false);

    // Act
    const { result } = renderHook(() => useDeviceType(), { wrapper });

    // Assert
    expect(result.current.isDesktop).toBe(false);
  });

  it("queries the 'md' breakpoint", () => {
    // Arrange
    mockUseMediaQuery.mockReturnValue(false);

    // Act
    renderHook(() => useDeviceType(), { wrapper });

    // Assert — the argument passed to useMediaQuery should contain the md breakpoint
    const query = vi.mocked(useMediaQuery).mock.calls[0][0];
    expect(String(query)).toMatch("@media (min-width:900px)");
  });
});
