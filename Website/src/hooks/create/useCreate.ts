import { useCallback, useState } from "react";

import { useCreatePost, type UploadSource, type UploadPayload } from "@hobbyist/hooks";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { useBackgroundTasks } from "@/hooks/app/useBackgroundTasks";
import { saveUpload, deleteUpload, type PersistedUpload } from "@/lib/uploadStore";
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
  const { methods, buildPayload, submit } = useCreatePost(axiosInstance, uploadToStorage);
  const { run } = useBackgroundTasks();
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

  // --- Background upload dispatch ---

  // Persist the payload before uploading so a tab close/crash is recoverable; slug saved once init
  // succeeds, success drops the snapshot, failure leaves it for resume. Persistence is best-effort.
  const dispatch = (payload: UploadPayload<File>, label: string) => {
    const record: PersistedUpload = { id: crypto.randomUUID(), createdAt: Date.now(), payload };
    void run(async () => {
      await saveUpload(record).catch(() => {});
      await submit(payload, (slug) => saveUpload({ ...record, slug }).catch(() => {}));
      await deleteUpload(record.id).catch(() => {});
    }, { label });
  };

  // --- Submit ---

  const handleSubmit = (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
    if (files.length === 0) {
      onFilesError("Please upload at least one image or video before continuing.");
      return;
    }

    // Optimistic: navigate to the profile now; the upload runs in the background.
    onPostCreated();
    dispatch(buildPayload(toUploadSources(files), true), "Publishing your post");
  };

  // --- Draft save (called by navigation blocker dialog) ---

  // Background upload like publish; the caller proceeds to its own destination. A draft is still
  // media-first, so an empty set is nothing to save.
  const handleSaveDraft = (files: FileWithMetadata[]) => {
    if (files.length === 0) return;
    dispatch(buildPayload(toUploadSources(files), false), "Saving your draft");
  };

  return {
    methods,
    activeStep,
    handleNext,
    handleBack,
    handleSubmit,
    saveDraft: handleSaveDraft,
  };
}
