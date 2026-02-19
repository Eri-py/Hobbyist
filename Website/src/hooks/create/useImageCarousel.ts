import { useState } from "react";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

export function useImageCarousel(files: FileWithMetadata[]) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
  };

  return {
    currentIndex,
    setCurrentIndex,
    handlePrevious,
    handleNext,
    currentFile: files[currentIndex],
  };
}
