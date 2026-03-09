import { renderHook, act, render } from "@testing-library/react";
import { isValidElement, createElement, type ReactNode } from "react";
import { describe, it, expect } from "vitest";

import { MobileHeaderProvider } from "@/providers/app/MobileHeaderProvider";
import { useMobileHeader, useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";

// ---------------------------------------------------------------------------
// Shared wrapper — a single MobileHeaderProvider for the whole test tree.
// ---------------------------------------------------------------------------
const wrapper = ({ children }: { children: ReactNode }) => (
  <MobileHeaderProvider>{children}</MobileHeaderProvider>
);

// ---------------------------------------------------------------------------
// Slot management
// ---------------------------------------------------------------------------
describe("MobileHeaderProvider — slot management", () => {
  it("all slots are React elements (defaults) before any custom slot is set", () => {
    // Act
    const { result } = renderHook(() => useMobileHeader(), { wrapper });

    // Assert
    expect(isValidElement(result.current.leftSlot)).toBe(true);
    expect(isValidElement(result.current.centerSlot)).toBe(true);
    expect(isValidElement(result.current.rightSlot)).toBe(true);
  });

  it("setLeftSlot replaces the left slot with the supplied node", () => {
    // Arrange
    const { result } = renderHook(() => useMobileHeader(), { wrapper });
    const customLeft = createElement("span", null, "Left");

    // Act
    act(() => result.current.setLeftSlot(customLeft));

    // Assert
    expect(result.current.leftSlot).toBe(customLeft);
  });

  it("setLeftSlot(null) reverts the left slot to the default", () => {
    // Arrange
    const { result } = renderHook(() => useMobileHeader(), { wrapper });
    const customLeft = createElement("span", null, "Left");

    act(() => result.current.setLeftSlot(customLeft));
    expect(result.current.leftSlot).toBe(customLeft);

    // Act
    act(() => result.current.setLeftSlot(null));

    // Assert
    expect(isValidElement(result.current.leftSlot)).toBe(true);
    expect(result.current.leftSlot).not.toBe(customLeft);
  });

  it("center and right slots update independently of the left slot", () => {
    // Arrange
    const { result } = renderHook(() => useMobileHeader(), { wrapper });
    const customCenter = createElement("h1", null, "Center");
    const customRight = createElement("button", null, "Right");

    // Act
    act(() => {
      result.current.setCenterSlot(customCenter);
      result.current.setRightSlot(customRight);
    });

    // Assert
    expect(result.current.centerSlot).toBe(customCenter);
    expect(result.current.rightSlot).toBe(customRight);
    expect(isValidElement(result.current.leftSlot)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useMobileHeaderConfig integration
// ---------------------------------------------------------------------------

// Helper component that mounts/unmounts the config hook
function ConfigHook({
  left,
  center,
  right,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  useMobileHeaderConfig({ left, center, right });
  return null;
}

// Helper to read context values for assertion
function SlotReader({ onRead }: { onRead: (slots: ReturnType<typeof useMobileHeader>) => void }) {
  const slots = useMobileHeader();
  onRead(slots);
  return null;
}

describe("useMobileHeaderConfig integration", () => {
  it("sets all provided slots on mount", () => {
    // Arrange
    const leftNode = createElement("span", null, "Left");
    const centerNode = createElement("span", null, "Center");
    const rightNode = createElement("span", null, "Right");

    // Act
    const { result } = renderHook(
      () => {
        useMobileHeaderConfig({ left: leftNode, center: centerNode, right: rightNode });
        return useMobileHeader();
      },
      { wrapper },
    );

    // Assert
    expect(result.current.leftSlot).toBe(leftNode);
    expect(result.current.centerSlot).toBe(centerNode);
    expect(result.current.rightSlot).toBe(rightNode);
  });

  it("unspecified slots revert to their defaults", () => {
    // Arrange
    const leftNode = createElement("span", null, "Left");

    // Act
    const { result } = renderHook(
      () => {
        useMobileHeaderConfig({ left: leftNode });
        return useMobileHeader();
      },
      { wrapper },
    );

    // Assert
    expect(result.current.leftSlot).toBe(leftNode);
    expect(isValidElement(result.current.centerSlot)).toBe(true);
    expect(isValidElement(result.current.rightSlot)).toBe(true);
  });

  it("clears custom slots on unmount, restoring defaults", () => {
    // Arrange
    const leftNode = createElement("span", null, "Left");
    let capturedSlots: ReturnType<typeof useMobileHeader> | undefined;

    function App({ showConfig }: { showConfig: boolean }) {
      return (
        <MobileHeaderProvider>
          {showConfig && <ConfigHook left={leftNode} />}
          <SlotReader onRead={(s) => (capturedSlots = s)} />
        </MobileHeaderProvider>
      );
    }

    const { rerender } = render(<App showConfig={true} />);
    expect(capturedSlots!.leftSlot).toBe(leftNode);

    // Act
    rerender(<App showConfig={false} />);

    // Assert
    expect(isValidElement(capturedSlots!.leftSlot)).toBe(true);
    expect(capturedSlots!.leftSlot).not.toBe(leftNode);
  });

  it("updates a slot when the prop changes", () => {
    // Arrange
    const nodeA = createElement("span", null, "A");
    const nodeB = createElement("span", null, "B");

    const { result, rerender } = renderHook(
      ({ left }: { left: ReactNode }) => {
        useMobileHeaderConfig({ left });
        return useMobileHeader();
      },
      { initialProps: { left: nodeA as ReactNode }, wrapper },
    );
    expect(result.current.leftSlot).toBe(nodeA);

    // Act
    rerender({ left: nodeB });

    // Assert
    expect(result.current.leftSlot).toBe(nodeB);
  });

  it("clears a slot when its prop is replaced with null", () => {
    // Arrange
    const leftNode = createElement("span", null, "Left");

    const { result, rerender } = renderHook(
      ({ left }: { left: ReactNode }) => {
        useMobileHeaderConfig({ left });
        return useMobileHeader();
      },
      { initialProps: { left: leftNode as ReactNode }, wrapper },
    );
    expect(result.current.leftSlot).toBe(leftNode);

    // Act
    rerender({ left: null });

    // Assert
    expect(isValidElement(result.current.leftSlot)).toBe(true);
    expect(result.current.leftSlot).not.toBe(leftNode);
  });
});
