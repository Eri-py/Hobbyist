import { act, renderHook } from "@testing-library/react";
import { type KeyboardEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInterestsStep } from "../../auth";

const { mockSetValue } = vi.hoisted(() => ({
  mockSetValue: vi.fn(),
}));

let watchedInterests: string[] = [];
let formErrors: Record<string, unknown> = {};
type NestedUnknownRecord = Record<string, unknown>;

type MockKeyboardEvent = {
  key: string;
  preventDefault: ReturnType<typeof vi.fn>;
  stopPropagation: ReturnType<typeof vi.fn>;
};

vi.mock("react-hook-form", () => ({
  useFormContext: vi.fn(() => ({
    setValue: mockSetValue,
    formState: { errors: formErrors },
  })),
  useWatch: vi.fn(() => watchedInterests),
  get: vi.fn((obj: NestedUnknownRecord, path: string) => {
    return path.split(".").reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== "object") return undefined;
      return (acc as NestedUnknownRecord)[key];
    }, obj);
  }),
}));

describe("useInterestsStep", () => {
  beforeEach(() => {
    watchedInterests = [];
    formErrors = {};
    mockSetValue.mockReset();
    mockSetValue.mockImplementation((name: string, value: string[]) => {
      if (name === "interests") watchedInterests = value;
    });
  });

  it("returns watched interests and derived customInterests", () => {
    // Arrange
    watchedInterests = ["cards", "stamps", "coins"];

    // Act
    const { result } = renderHook(() => useInterestsStep(["cards", "coins"]));

    // Assert
    expect(result.current.interests).toEqual(["cards", "stamps", "coins"]);
    expect(result.current.customInterests).toEqual(["stamps"]);
    expect(result.current.interestsError).toBeUndefined();
  });

  it("maps interests.message from form errors", () => {
    // Arrange
    formErrors = { interests: { message: "Pick at least one interest" } };

    // Act
    const { result } = renderHook(() => useInterestsStep(["cards"]));

    // Assert
    expect(result.current.interestsError).toBe("Pick at least one interest");
  });

  it("updateCustomInput sets customInput state", () => {
    // Arrange
    const { result } = renderHook(() => useInterestsStep(["cards"]));

    // Act
    act(() => result.current.updateCustomInput("figurines"));

    // Assert
    expect(result.current.customInput).toBe("figurines");
  });

  it("toggleCategory adds category when not selected", () => {
    // Arrange
    watchedInterests = ["cards"];
    const { result } = renderHook(() => useInterestsStep(["cards"]));

    // Act
    act(() => result.current.toggleCategory("coins"));

    // Assert
    expect(mockSetValue).toHaveBeenCalledWith("interests", ["cards", "coins"], {
      shouldValidate: true,
    });
  });

  it("toggleCategory removes category when already selected", () => {
    // Arrange
    watchedInterests = ["cards", "coins"];
    const { result } = renderHook(() => useInterestsStep(["cards", "coins"]));

    // Act
    act(() => result.current.toggleCategory("cards"));

    // Assert
    expect(mockSetValue).toHaveBeenCalledWith("interests", ["coins"], {
      shouldValidate: true,
    });
  });

  it("addCustom adds trimmed unique value and clears input", () => {
    // Arrange
    watchedInterests = ["cards"];
    const { result } = renderHook(() => useInterestsStep(["cards"]));
    act(() => result.current.updateCustomInput("  figurines  "));

    // Act
    act(() => result.current.addCustom());

    // Assert
    expect(mockSetValue).toHaveBeenCalledWith("interests", ["cards", "figurines"], {
      shouldValidate: true,
    });
    expect(result.current.customInput).toBe("");
  });

  it("addCustom does not add duplicates and still clears input", () => {
    // Arrange
    watchedInterests = ["cards"];
    const { result } = renderHook(() => useInterestsStep(["cards"]));
    act(() => result.current.updateCustomInput("cards"));

    // Act
    act(() => result.current.addCustom());

    // Assert
    expect(mockSetValue).not.toHaveBeenCalled();
    expect(result.current.customInput).toBe("");
  });

  it("addCustom does not add empty input", () => {
    // Arrange
    const { result } = renderHook(() => useInterestsStep(["cards"]));
    act(() => result.current.updateCustomInput("   "));

    // Act
    act(() => result.current.addCustom());

    // Assert
    expect(mockSetValue).not.toHaveBeenCalled();
    expect(result.current.customInput).toBe("");
  });

  it("removeCustom removes a selected interest", () => {
    // Arrange
    watchedInterests = ["cards", "figurines", "coins"];
    const { result } = renderHook(() => useInterestsStep(["cards", "coins"]));

    // Act
    act(() => result.current.removeCustom("figurines"));

    // Assert
    expect(mockSetValue).toHaveBeenCalledWith("interests", ["cards", "coins"], {
      shouldValidate: true,
    });
  });

  it("onInputKeyDown with Enter prevents default, stops propagation, and adds custom", () => {
    // Arrange
    watchedInterests = ["cards"];
    const { result } = renderHook(() => useInterestsStep(["cards"]));
    act(() => result.current.updateCustomInput("figurines"));
    const event: MockKeyboardEvent = {
      key: "Enter",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    // Act
    act(() => result.current.onInputKeyDown(event as unknown as KeyboardEvent));

    // Assert
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith("interests", ["cards", "figurines"], {
      shouldValidate: true,
    });
  });

  it("onInputKeyDown ignores non-Enter keys", () => {
    // Arrange
    const { result } = renderHook(() => useInterestsStep(["cards"]));
    const event: MockKeyboardEvent = {
      key: "Space",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    // Act
    act(() => result.current.onInputKeyDown(event as unknown as KeyboardEvent));

    // Assert
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(mockSetValue).not.toHaveBeenCalled();
  });
});
