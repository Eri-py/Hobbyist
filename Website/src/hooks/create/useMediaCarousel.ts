import { useState } from "react";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

export function useMediaCarousel(files: FileWithMetadata[]) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    if (files.length === 0) {
      return;
    }
    setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (files.length === 0) {
      return;
    }
    setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
  };

  const safeIndex = files.length === 0 ? 0 : Math.min(currentIndex, files.length - 1);

  return {
    currentIndex: safeIndex,
    setCurrentIndex,
    handlePrevious,
    handleNext,
    currentFile: files[files.length === 0 ? 0 : safeIndex],
  };
}
