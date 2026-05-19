import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { generateThumbnail } from "./generateThumbnail";
import { compressImage } from "./compressImage";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total
const MAX_FILES = 15;

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
      if (acceptedFiles.length > 0) {
        // Keep track of the original order before sorting
        const filesWithIndex = acceptedFiles.map((file, index) => ({ file, originalIndex: index }));

        // Sort by size for processing
        const sortedFiles = filesWithIndex.sort((a, b) => a.file.size - b.file.size);

        // Get current size and slot count of all files already stored.
        let currentTotal = 0;
        filesWithMetadata.forEach((f) => (currentTotal += f.file.size));
        const availableSlots = MAX_FILES - filesWithMetadata.length;

        // Keep track of added files and rejected files.
        const toAdd: { file: File; originalIndex: number }[] = [];
        const rejected: string[] = [];

        for (const { file, originalIndex } of sortedFiles) {
          if (toAdd.length >= availableSlots) {
            rejected.push(`${file.name}: Maximum ${MAX_FILES} files allowed.`);
          } else if (currentTotal + file.size > MAX_TOTAL_SIZE) {
            rejected.push(
              `${file.name}: Not enough space (${(currentTotal / 1024 / 1024).toFixed(2)}MB of ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB used)`,
            );
          } else {
            currentTotal += file.size;
            toAdd.push({ file, originalIndex });
          }
        }

        // Sort toAdd back to original upload order
        toAdd.sort((a, b) => a.originalIndex - b.originalIndex);

        // Compress images and generate thumbnails
        const newFilesWithMetadata: FileWithMetadata[] = await Promise.all(
          toAdd.map(async ({ file }) => {
            const processedFile = await compressImage(file);
            return {
              id: crypto.randomUUID(),
              file: processedFile,
              preview: await generateThumbnail(processedFile),
            };
          }),
        );

        setFilesWithMetadata((prev) => [...prev, ...newFilesWithMetadata]);

        if (rejected.length > 0) {
          setErrors((prev) => [...prev, ...rejected.map(createMediaUploadError)]);
        }
      }
    },
    [filesWithMetadata],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length === 0) return;

    const errorMessages = fileRejections.map((rejection) => {
      const fileName = rejection.file.name;
      const errorCode = rejection.errors[0]?.code;

      switch (errorCode) {
        case "file-invalid-type":
          return `${fileName}: Invalid file type. Please upload image or video files only.`;
        case "file-too-large":
          return `${fileName}: File is too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB per file.`;
        default:
          return `${fileName}: Failed to upload. ${rejection.errors[0]?.message || "Unknown error"}`;
      }
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
    maxSize: MAX_FILE_SIZE,
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
