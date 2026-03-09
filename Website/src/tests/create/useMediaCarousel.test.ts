import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeFile = (id: string): FileWithMetadata => ({
  id,
  file: new File([], `${id}.jpg`, { type: "image/jpeg" }),
  preview: `blob:${id}`,
});

const file1 = makeFile("f1");
const file2 = makeFile("f2");
const file3 = makeFile("f3");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useMediaCarousel", () => {
  describe("initial state", () => {
    it("starts at index 0 for a non-empty list", () => {
      // Act
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));

      // Assert
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentFile).toBe(file1);
    });

    it("returns index 0 and undefined currentFile for an empty list", () => {
      // Act
      const { result } = renderHook(() => useMediaCarousel([]));

      // Assert
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentFile).toBeUndefined();
    });
  });

  describe("handleNext", () => {
    it("advances to the next file", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));

      // Act
      act(() => result.current.handleNext());

      // Assert
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentFile).toBe(file2);
    });

    it("wraps around from the last file back to the first", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));
      act(() => result.current.setCurrentIndex(2));

      // Act
      act(() => result.current.handleNext());

      // Assert
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentFile).toBe(file1);
    });

    it("does nothing when the file list is empty", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([]));

      // Act
      act(() => result.current.handleNext());

      // Assert
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe("handlePrevious", () => {
    it("moves back to the previous file", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));
      act(() => result.current.setCurrentIndex(2));

      // Act
      act(() => result.current.handlePrevious());

      // Assert
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentFile).toBe(file2);
    });

    it("wraps around from the first file to the last", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));

      // Act
      act(() => result.current.handlePrevious());

      // Assert
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentFile).toBe(file3);
    });

    it("does nothing when the file list is empty", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([]));

      // Act
      act(() => result.current.handlePrevious());

      // Assert
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe("safeIndex clamping", () => {
    it("clamps currentIndex when the file list shrinks", () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ files }: { files: FileWithMetadata[] }) => useMediaCarousel(files),
        { initialProps: { files: [file1, file2, file3] } },
      );
      act(() => result.current.setCurrentIndex(2));
      expect(result.current.currentIndex).toBe(2);

      // Act — remove the last file; list now has 2 items, valid indices: 0 and 1
      rerender({ files: [file1, file2] });

      // Assert
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentFile).toBe(file2);
    });

    it("stays at 0 when the list is cleared", () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ files }: { files: FileWithMetadata[] }) => useMediaCarousel(files),
        { initialProps: { files: [file1, file2] } },
      );
      act(() => result.current.setCurrentIndex(1));

      // Act
      rerender({ files: [] });

      // Assert
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe("setCurrentIndex", () => {
    it("jumps directly to a given index", () => {
      // Arrange
      const { result } = renderHook(() => useMediaCarousel([file1, file2, file3]));

      // Act
      act(() => result.current.setCurrentIndex(2));

      // Assert
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentFile).toBe(file3);
    });
  });
});
