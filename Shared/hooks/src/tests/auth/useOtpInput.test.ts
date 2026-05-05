import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOtpInput } from "../../auth";

describe("useOtpInput", () => {
  it("emits onChange and onComplete for multi-character entry in first input", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();

    const { result } = renderHook(() =>
      useOtpInput({
        value: "",
        length: 6,
        onChange,
        onComplete,
      }),
    );

    act(() => {
      result.current.handleInputChange(0, "123456");
    });

    expect(onChange).toHaveBeenCalledWith("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("filters characters based on validateChar", () => {
    const onChange = vi.fn();

    const { result } = renderHook(() =>
      useOtpInput({
        value: "",
        length: 4,
        onChange,
        validateChar: (character) => /^[0-9]$/.test(character),
      }),
    );

    act(() => {
      result.current.handleInputChange(0, "a");
    });

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("fills from the first empty slot when pasting", () => {
    const onChange = vi.fn();

    const { result } = renderHook(() =>
      useOtpInput({
        value: "12",
        length: 6,
        onChange,
        validateChar: (character) => /^[0-9]$/.test(character),
      }),
    );

    act(() => {
      result.current.handleInputPaste(2, "3456");
    });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("clears current character on backspace at caret start", () => {
    const onChange = vi.fn();

    const { result } = renderHook(() =>
      useOtpInput({
        value: "12",
        length: 6,
        onChange,
      }),
    );

    act(() => {
      result.current.handleInputKeyDown(1, {
        key: "Backspace",
        currentValue: "2",
        selectionStart: 0,
        selectionEnd: 0,
      });
    });

    expect(onChange).toHaveBeenCalledWith("1");
  });
});
