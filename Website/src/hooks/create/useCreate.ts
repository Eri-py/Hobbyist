import { useCallback, useState } from "react";

import { useCreatePost, type UploadSource } from "@hobbyist/hooks";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { axiosInstance } from "@/api/axiosInstance";
import { uploadToStorage } from "@/api/uploadToStorage";

// --- Small-screen step config ---

const smallScreenStepFields: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [],
  1: ["hobby", "title", "description", "availableForTrade", "lookingFor"],
};

const SMALL_SCREEN_STEP_COUNT = Object.keys(smallScreenStepFields).length;

// Carousel order is the array order; the upload manifest's position derives
// from it in the shared engine.
const toUploadSources = (files: FileWithMetadata[]): UploadSource<File>[] =>
  files.map((f) => ({
    file: f.file,
    fileName: f.file.name,
    contentType: f.file.type,
    byteSize: f.file.size,
  }));

// --- Hook ---

export function useCreate(onPostCreated: () => void) {
  const { methods, createPost, saveDraft, isSavingDraft } = useCreatePost(
    axiosInstance,
    uploadToStorage,
  );
  const [activeStep, setActiveStep] = useState<number>(0);

  // --- Small-screen step navigation ---

  const handleNext = useCallback(
    async (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
      if (activeStep === 0) {
        if (files.length === 0) {
          onFilesError("Please upload at least one image or video before continuing.");
          return;
        }
        setActiveStep((prev) => Math.min(prev + 1, SMALL_SCREEN_STEP_COUNT - 1));
        return;
      }

      const isValid = await methods.trigger(smallScreenStepFields[activeStep]);
      if (!isValid) return;

      setActiveStep((prev) => Math.min(prev + 1, SMALL_SCREEN_STEP_COUNT - 1));
    },
    [activeStep, methods],
  );

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // --- Submit ---

  const handleSubmit = (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
    if (files.length === 0) {
      onFilesError("Please upload at least one image or video before continuing.");
      return;
    }

    // Optimistic: navigate away now; the upload runs fire-and-forget in-page.
    onPostCreated();
    createPost(toUploadSources(files));
  };

  // --- Draft save (called by navigation blocker dialog) ---

  const handleSaveDraft = useCallback(
    (files: FileWithMetadata[]) => saveDraft(toUploadSources(files)),
    [saveDraft],
  );

  return {
    methods,
    activeStep,
    handleNext,
    handleBack,
    handleSubmit,
    saveDraft: handleSaveDraft,
    isSavingDraft,
  };
}
