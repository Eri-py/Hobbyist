import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { generateThumbnail } from "./generateThumbnail";
import { compressImage } from "./compressImage";
import { MAX_FILE_SIZE, MAX_TOTAL_SIZE, MAX_FILES } from "@hobbyist/hooks";

export type FileWithMetadata = {
  id: string;
  file: File;
  preview: string;
};

export type MediaUploadError = {
  id: string;
  message: string;
};

const createMediaUploadError = (message: string): MediaUploadError => ({
  id: crypto.randomUUID(),
  message,
});

export function useMediaUpload() {
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileWithMetadata[]>([]);
  const [errors, setErrors] = useState<MediaUploadError[]>([]);

  // Auto-clear errors after 20 seconds
  useEffect(() => {
    if (errors.length === 0) return;

    const timerId = setTimeout(() => {
      setErrors([]);
    }, 20000);

    return () => clearTimeout(timerId);
  }, [errors]);

  // Keep a ref in sync so the unmount cleanup always sees the latest files.
  const filesRef = useRef(filesWithMetadata);
  useEffect(() => {
    filesRef.current = filesWithMetadata;
  }, [filesWithMetadata]);

  useEffect(() => {
    return () => filesRef.current.forEach((f: FileWithMetadata) => URL.revokeObjectURL(f.preview));
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const withIndex = acceptedFiles.map((file, i) => ({ file, i }));
      // Sort smallest-first so we fit as many files as possible within the total limit.
      const sorted = [...withIndex].sort((a, b) => a.file.size - b.file.size);

      const availableSlots = MAX_FILES - filesWithMetadata.length;
      const candidates = sorted.slice(0, availableSlots);
      const overflow = sorted.slice(availableSlots);

      const rejected: string[] = overflow.map(
        ({ file }) => `${file.name}: Maximum ${MAX_FILES} files allowed.`,
      );

      // Compress all candidates in parallel, then size-check against compressed sizes.
      const compressed = await Promise.all(
        candidates.map(async ({ file, i }) => ({
          file: await compressImage(file),
          originalName: file.name,
          i,
        })),
      );
      // Restore original drop order before the size check.
      compressed.sort((a, b) => a.i - b.i);

      let currentTotal = filesWithMetadata.reduce((sum, f) => sum + f.file.size, 0);
      const accepted: (typeof compressed)[number][] = [];

      for (const entry of compressed) {
        if (entry.file.size > MAX_FILE_SIZE) {
          rejected.push(
            `${entry.originalName}: Exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB per-file limit.`,
          );
        } else if (currentTotal + entry.file.size > MAX_TOTAL_SIZE) {
          rejected.push(
            `${entry.originalName}: Not enough space (${(currentTotal / 1024 / 1024).toFixed(2)}MB of ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB used)`,
          );
        } else {
          currentTotal += entry.file.size;
          accepted.push(entry);
        }
      }

      const newFilesWithMetadata: FileWithMetadata[] = await Promise.all(
        accepted.map(async ({ file }) => ({
          id: crypto.randomUUID(),
          file,
          preview: await generateThumbnail(file),
        })),
      );

      setFilesWithMetadata((prev) => [...prev, ...newFilesWithMetadata]);

      if (rejected.length > 0) {
        setErrors((prev) => [...prev, ...rejected.map(createMediaUploadError)]);
      }
    },
    [filesWithMetadata],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length === 0) return;

    const errorMessages = fileRejections.map((rejection) => {
      const fileName = rejection.file.name;
      const code = rejection.errors[0]?.code;
      if (code === "file-invalid-type") {
        return `${fileName}: Invalid file type. Please upload image or video files only.`;
      }
      if (code === "file-too-large") {
        const limitMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(2);
        return `${fileName}: Failed to upload. File is too large (limit: ${limitMB}MB).`;
      }
      return `${fileName}: Failed to upload. ${rejection.errors[0]?.message || "Unknown error"}`;
    });

    setErrors((prev) => [...prev, ...errorMessages.map(createMediaUploadError)]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "video/mp4": [".mp4"],
      "video/mpeg": [".mpeg"],
      "video/ogg": [".ogv"],
      "video/webm": [".webm"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
    multiple: true,
    maxFiles: MAX_FILES,
  });

  const removeFile = useCallback((fileId: string) => {
    setFilesWithMetadata((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (!fileToRemove) return prev;
      URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, createMediaUploadError(message)]);
  }, []);

  const reorderFiles = useCallback((newOrder: FileWithMetadata[]) => {
    setFilesWithMetadata(newOrder);
  }, []);

  const clearFiles = useCallback(() => {
    setFilesWithMetadata((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, []);

  return {
    files: filesWithMetadata,
    errors,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    removeError,
    addError,
    reorderFiles,
    clearFiles,
  };
}
