import { useCallback, useState, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { generateThumbnail } from "./generateThumbnail";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

export type FileWithMetadata = {
  id: string;
  file: File;
  preview: string;
};

export function useMediaUpload() {
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileWithMetadata[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-clear errors after 10 seconds with cleanup
  useEffect(() => {
    if (errors.length === 0) return;

    const timerId = setTimeout(() => {
      setErrors([]);
    }, 10000);

    return () => clearTimeout(timerId);
  }, [errors]);

  // Clean up all object URLs when component unmounts
  useEffect(() => {
    return () => {
      filesWithMetadata.forEach((fileWithMetadata) => {
        URL.revokeObjectURL(fileWithMetadata.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const sortedFiles = acceptedFiles.sort((a, b) => a.size - b.size);

        // Get current size of all files stored
        let currentTotal = 0;
        filesWithMetadata.forEach((f) => (currentTotal += f.file.size));

        // Keep track of added files and rejected files.
        const toAdd: File[] = [];
        const rejected: string[] = [];

        for (const file of sortedFiles) {
          if (currentTotal + file.size > MAX_TOTAL_SIZE) {
            rejected.push(
              `${file.name}: Not enough space (${(currentTotal / 1024 / 1024).toFixed(2)}MB of ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB used)`,
            );
          } else {
            currentTotal += file.size;
            toAdd.push(file);
          }
        }

        // Generate thumbnails for all accepted files
        const newFilesWithMetadata: FileWithMetadata[] = await Promise.all(
          toAdd.map(async (file) => ({
            id: crypto.randomUUID(),
            file,
            preview: await generateThumbnail(file),
          })),
        );

        setFilesWithMetadata((prev) => [...prev, ...newFilesWithMetadata]);
        setErrors([...rejected]);
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

    setErrors((prev) => [...prev, ...errorMessages]);
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
  });

  const removeFile = useCallback((fileId: string) => {
    setFilesWithMetadata((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);

      if (!fileToRemove) return prev;

      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const removeError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderFiles = useCallback((newOrder: FileWithMetadata[]) => {
    setFilesWithMetadata(newOrder);
  }, []);

  return {
    files: filesWithMetadata,
    errors,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    removeError,
    reorderFiles,
  };
}
