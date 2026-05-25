import { useCallback, useState } from "react";

import { useCreatePost, appendPostFields, appendDraftFields } from "@hobbyist/hooks";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { axiosInstance } from "@/api/axiosInstance";

// --- Small-screen step config ---

const smallScreenStepFields: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [],
  1: ["hobby", "title", "description", "availableForTrade", "lookingFor"],
};

const SMALL_SCREEN_STEP_COUNT = Object.keys(smallScreenStepFields).length;

// --- Hook ---

export function useCreate(onPostCreated: () => void) {
  const { methods, createPost, saveDraft, isSavingDraft } = useCreatePost(axiosInstance);
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

  const handleSubmit = (
    values: CreateFormSchemaTypes,
    files: FileWithMetadata[],
    onFilesError: (message: string) => void,
  ) => {
    if (files.length === 0) {
      onFilesError("Please upload at least one image or video before continuing.");
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append("media", f.file));
    appendPostFields(formData, values);

    onPostCreated();
    createPost(formData);
  };

  // --- Draft save (called by navigation blocker dialog) ---

  const handleSaveDraft = useCallback(
    (files: FileWithMetadata[]) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("media", f.file));
      appendDraftFields(formData, methods.getValues());
      return saveDraft(formData);
    },
    [methods, saveDraft],
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
