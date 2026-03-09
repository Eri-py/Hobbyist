import { renderHook, act } from "@testing-library/react";
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import type { FileRejection } from "react-dropzone";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before the imports they affect
// ---------------------------------------------------------------------------

// generateThumbnail is async; mock it to resolve immediately
vi.mock("@/hooks/create/generateThumbnail", () => ({
  generateThumbnail: vi.fn().mockResolvedValue("data:image/jpeg;base64,thumbnail"),
}));

// Capture the dropzone callbacks so we can invoke them directly in tests
let capturedOnDrop: ((files: File[]) => Promise<void>) | undefined;
let capturedOnDropRejected: ((rejections: FileRejection[]) => void) | undefined;

vi.mock("react-dropzone", () => ({
  useDropzone: vi
    .fn()
    .mockImplementation(
      (options: {
        onDrop: (files: File[]) => Promise<void>;
        onDropRejected: (rejections: FileRejection[]) => void;
      }) => {
        capturedOnDrop = options.onDrop;
        capturedOnDropRejected = options.onDropRejected;
        return {
          getRootProps: vi.fn(() => ({})),
          getInputProps: vi.fn(() => ({})),
          isDragActive: false,
        };
      },
    ),
}));

import { useMediaUpload } from "@/hooks/create/useMediaUpload";

// ---------------------------------------------------------------------------
// Global stubs for browser APIs unavailable in jsdom
// ---------------------------------------------------------------------------
let uuidCounter = 0;

beforeAll(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  uuidCounter = 0;
  capturedOnDrop = undefined;
  capturedOnDropRejected = undefined;
  vi.mocked(URL.revokeObjectURL).mockClear();
  vi.mocked(URL.createObjectURL).mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeImageFile = (name = "photo.jpg", sizeBytes = 1024 * 1024) => {
  const file = new File(["x"], name, { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: sizeBytes, configurable: true });
  return file;
};

const makeRejection = (file: File, code: string, message: string): FileRejection => ({
  file,
  errors: [{ code, message }],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useMediaUpload", () => {
  describe("initial state", () => {
    it("starts with no files and no errors", () => {
      // Act
      const { result } = renderHook(() => useMediaUpload());

      // Assert
      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(0);
    });
  });

  // --- Error management ----------------------------------------------------

  describe("addError / removeError", () => {
    it("addError appends a new error with a unique id", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());

      // Act
      act(() => result.current.addError("Something went wrong"));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toBe("Something went wrong");
      expect(result.current.errors[0].id).toBeTruthy();
    });

    it("removeError removes the error with the matching id", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      act(() => result.current.addError("Error A"));
      act(() => result.current.addError("Error B"));
      const idToRemove = result.current.errors[0].id;

      // Act
      act(() => result.current.removeError(idToRemove));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toBe("Error B");
    });

    it("errors auto-clear after 20 seconds", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useMediaUpload());
      act(() => result.current.addError("Timed error"));
      expect(result.current.errors).toHaveLength(1);

      // Act
      act(() => vi.advanceTimersByTime(20000));

      // Assert
      expect(result.current.errors).toHaveLength(0);
      vi.useRealTimers();
    });

    it("errors do not clear before the 20-second window", () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useMediaUpload());
      act(() => result.current.addError("Timed error"));

      // Act
      act(() => vi.advanceTimersByTime(19999));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      vi.useRealTimers();
    });
  });

  // --- File management -----------------------------------------------------

  describe("removeFile", () => {
    it("removes the file with the matching id and revokes its URL", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile();
      await act(async () => {
        await capturedOnDrop!([file]);
      });
      const fileId = result.current.files[0].id;

      // Act
      act(() => result.current.removeFile(fileId));

      // Assert
      expect(result.current.files).toHaveLength(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("data:image/jpeg;base64,thumbnail");
    });

    it("does nothing when no file matches the given id", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile();
      await act(async () => {
        await capturedOnDrop!([file]);
      });

      // Act
      act(() => result.current.removeFile("non-existent-id"));

      // Assert
      expect(result.current.files).toHaveLength(1);
    });
  });

  describe("reorderFiles", () => {
    it("replaces the file list with the provided order", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");
      await act(async () => {
        await capturedOnDrop!([fileA, fileB]);
      });
      const [first, second] = result.current.files;

      // Act
      act(() => result.current.reorderFiles([second, first]));

      // Assert
      expect(result.current.files[0]).toBe(second);
      expect(result.current.files[1]).toBe(first);
    });
  });

  describe("clearFiles", () => {
    it("removes all files and revokes their URLs", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");
      await act(async () => {
        await capturedOnDrop!([fileA, fileB]);
      });
      expect(result.current.files).toHaveLength(2);

      // Act
      act(() => result.current.clearFiles());

      // Assert
      expect(result.current.files).toHaveLength(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  // --- onDrop (file acceptance) --------------------------------------------

  describe("onDrop", () => {
    it("adds an accepted file with id, file ref, and thumbnail preview", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile("photo.jpg");

      // Act
      await act(async () => {
        await capturedOnDrop!([file]);
      });

      // Assert
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file).toBe(file);
      expect(result.current.files[0].preview).toBe("data:image/jpeg;base64,thumbnail");
      expect(result.current.files[0].id).toBeTruthy();
    });

    it("rejects files that would push the total over 100MB", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const MB = 1024 * 1024;
      const file1 = makeImageFile("big1.jpg", 60 * MB);
      const file2 = makeImageFile("big2.jpg", 60 * MB); // total 120MB, over limit

      // Act
      await act(async () => {
        await capturedOnDrop!([file1, file2]);
      });

      // Assert — only the first file should be accepted
      expect(result.current.files).toHaveLength(1);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toContain("Not enough space");
    });

    it("appends new files to any already-uploaded files", async () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");

      // Act
      await act(async () => {
        await capturedOnDrop!([fileA]);
      });
      await act(async () => {
        await capturedOnDrop!([fileB]);
      });

      // Assert
      expect(result.current.files).toHaveLength(2);
    });
  });

  // --- onDropRejected (file validation failures) ---------------------------

  describe("onDropRejected", () => {
    it("adds an error for an invalid file type", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "doc.pdf"),
        "file-invalid-type",
        "File type not accepted",
      );

      // Act
      act(() => capturedOnDropRejected!([rejection]));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toContain("Invalid file type");
      expect(result.current.errors[0].message).toContain("doc.pdf");
    });

    it("adds an error for a file that exceeds the per-file size limit", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "giant.mp4"),
        "file-too-large",
        "File is too large",
      );

      // Act
      act(() => capturedOnDropRejected!([rejection]));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toContain("too large");
      expect(result.current.errors[0].message).toContain("50.00MB");
    });

    it("adds a generic error for unknown rejection codes", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "weird.xyz"),
        "unknown-code",
        "Mysterious failure",
      );

      // Act
      act(() => capturedOnDropRejected!([rejection]));

      // Assert
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0].message).toContain("Mysterious failure");
    });

    it("does nothing when the rejections array is empty", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());

      // Act
      act(() => capturedOnDropRejected!([]));

      // Assert
      expect(result.current.errors).toHaveLength(0);
    });

    it("adds one error per rejected file", () => {
      // Arrange
      const { result } = renderHook(() => useMediaUpload());
      const rejections = [
        makeRejection(new File([], "a.pdf"), "file-invalid-type", "Invalid type"),
        makeRejection(new File([], "b.pdf"), "file-invalid-type", "Invalid type"),
      ];

      // Act
      act(() => capturedOnDropRejected!(rejections));

      // Assert
      expect(result.current.errors).toHaveLength(2);
    });
  });
});
