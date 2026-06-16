import { renderHook, act } from "@testing-library/react";
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import type { FileRejection } from "react-dropzone";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before the imports they affect
// ---------------------------------------------------------------------------

// Validation problems are surfaced through the central notification system; spy on it.
const { mockNotify } = vi.hoisted(() => ({ mockNotify: vi.fn() }));
vi.mock("@/hooks/app/useNotifications", () => ({
  useNotifications: () => ({ notify: mockNotify, dismiss: vi.fn() }),
}));

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
  mockNotify.mockClear();
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

// Pulls the message out of the nth notify({ severity, message }) call.
const notifiedMessage = (call = 0): string => mockNotify.mock.calls[call][0].message;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useMediaUpload", () => {
  describe("initial state", () => {
    it("starts with no files", () => {
      const { result } = renderHook(() => useMediaUpload());
      expect(result.current.files).toHaveLength(0);
    });
  });

  // --- Error reporting -----------------------------------------------------

  describe("addError", () => {
    it("notifies an error with the given message", () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => result.current.addError("Something went wrong"));

      expect(mockNotify).toHaveBeenCalledWith({
        severity: "error",
        message: "Something went wrong",
      });
    });
  });

  // --- File management -----------------------------------------------------

  describe("removeFile", () => {
    it("removes the file with the matching id and revokes its URL", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile();
      await act(async () => {
        await capturedOnDrop!([file]);
      });
      const fileId = result.current.files[0].id;

      act(() => result.current.removeFile(fileId));

      expect(result.current.files).toHaveLength(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("data:image/jpeg;base64,thumbnail");
    });

    it("does nothing when no file matches the given id", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile();
      await act(async () => {
        await capturedOnDrop!([file]);
      });

      act(() => result.current.removeFile("non-existent-id"));

      expect(result.current.files).toHaveLength(1);
    });
  });

  describe("reorderFiles", () => {
    it("replaces the file list with the provided order", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");
      await act(async () => {
        await capturedOnDrop!([fileA, fileB]);
      });
      const [first, second] = result.current.files;

      act(() => result.current.reorderFiles([second, first]));

      expect(result.current.files[0]).toBe(second);
      expect(result.current.files[1]).toBe(first);
    });
  });

  describe("clearFiles", () => {
    it("removes all files and revokes their URLs", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");
      await act(async () => {
        await capturedOnDrop!([fileA, fileB]);
      });
      expect(result.current.files).toHaveLength(2);

      act(() => result.current.clearFiles());

      expect(result.current.files).toHaveLength(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  // --- onDrop (file acceptance) --------------------------------------------

  describe("onDrop", () => {
    it("adds an accepted file with id, file ref, and thumbnail preview", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const file = makeImageFile("photo.jpg");

      await act(async () => {
        await capturedOnDrop!([file]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file).toBe(file);
      expect(result.current.files[0].preview).toBe("data:image/jpeg;base64,thumbnail");
      expect(result.current.files[0].id).toBeTruthy();
    });

    it("notifies and rejects files that would push the total over 100MB", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const MB = 1024 * 1024;
      const file1 = makeImageFile("big1.jpg", 40 * MB);
      const file2 = makeImageFile("big2.jpg", 40 * MB);
      const file3 = makeImageFile("big3.jpg", 40 * MB);

      await act(async () => {
        await capturedOnDrop!([file1, file2, file3]);
      });

      // First two files fit; the third is rejected for exceeding total space.
      expect(result.current.files).toHaveLength(2);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(notifiedMessage()).toContain("Not enough space");
    });

    it("appends new files to any already-uploaded files", async () => {
      const { result } = renderHook(() => useMediaUpload());
      const fileA = makeImageFile("a.jpg");
      const fileB = makeImageFile("b.jpg");

      await act(async () => {
        await capturedOnDrop!([fileA]);
      });
      await act(async () => {
        await capturedOnDrop!([fileB]);
      });

      expect(result.current.files).toHaveLength(2);
    });
  });

  // --- onDropRejected (file validation failures) ---------------------------

  describe("onDropRejected", () => {
    it("notifies an error for an invalid file type", () => {
      renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "doc.pdf"),
        "file-invalid-type",
        "File type not accepted",
      );

      act(() => capturedOnDropRejected!([rejection]));

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(notifiedMessage()).toContain("Invalid file type");
      expect(notifiedMessage()).toContain("doc.pdf");
    });

    it("notifies an error for a file that exceeds the per-file size limit", () => {
      renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "giant.mp4"),
        "file-too-large",
        "File is too large",
      );

      act(() => capturedOnDropRejected!([rejection]));

      expect(notifiedMessage()).toContain("too large");
      expect(notifiedMessage()).toContain("50.00MB");
    });

    it("notifies a generic error for unknown rejection codes", () => {
      renderHook(() => useMediaUpload());
      const rejection = makeRejection(
        new File([], "weird.xyz"),
        "unknown-code",
        "Mysterious failure",
      );

      act(() => capturedOnDropRejected!([rejection]));

      expect(notifiedMessage()).toContain("Mysterious failure");
    });

    it("does nothing when the rejections array is empty", () => {
      renderHook(() => useMediaUpload());

      act(() => capturedOnDropRejected!([]));

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("notifies one error per rejected file", () => {
      renderHook(() => useMediaUpload());
      const rejections = [
        makeRejection(new File([], "a.pdf"), "file-invalid-type", "Invalid type"),
        makeRejection(new File([], "b.pdf"), "file-invalid-type", "Invalid type"),
      ];

      act(() => capturedOnDropRejected!(rejections));

      expect(mockNotify).toHaveBeenCalledTimes(2);
    });
  });
});
