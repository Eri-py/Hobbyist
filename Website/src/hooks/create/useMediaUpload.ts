import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10; // Maximum number of files

export function useMediaUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles].slice(0, MAX_FILES));
      setErrors([]); // Clear any previous errors when successfully adding files
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length === 0) return;

    const errorMessages = fileRejections.map((rejection) => {
      const fileName = rejection.file.name;
      const errorCode = rejection.errors[0]?.code;

      switch (errorCode) {
        case "file-invalid-type":
          return `${fileName}: Invalid file type. Please upload image or video files only.`;
        case "file-too-large":
          return `${fileName}: File is too large. Maximum size is 10MB.`;
        case "too-many-files":
          return `Maximum ${MAX_FILES} files allowed.`;
        default:
          return `${fileName}: Failed to upload. ${rejection.errors[0]?.message || "Unknown error"}`;
      }
    });

    setErrors(errorMessages);
    setTimeout(() => setErrors([]), 10000);
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
    maxFiles: MAX_FILES,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  }, []);

  const setCoverFile = useCallback((index: number) => {
    setFiles((prev) => {
      if (index === 0) return prev; // Already cover
      const newFiles = [...prev];
      const [coverFile] = newFiles.splice(index, 1);
      return [coverFile, ...newFiles];
    });
  }, []);

  return {
    files,
    errors,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    removeError,
    reorderFiles,
    setCoverFile,
  };
}
