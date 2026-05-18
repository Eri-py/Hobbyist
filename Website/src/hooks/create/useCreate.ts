import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useServerError } from "@hobbyist/hooks";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { useDraftPost } from "@/hooks/create/useDraftPost";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";

// Define which form fields are validated at each mobile step.
const mobileStepFields: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [], // Media — validated via files array, not zod
  1: ["hobby", "title", "description", "availableForTrade", "lookingFor"],
};

const MOBILE_STEP_COUNT = Object.keys(mobileStepFields).length;

export function useCreate(onPostCreated: (postId: string) => void) {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();

  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      hobby: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });

  const {
    draftPostIdRef,
    onFilesAdded,
    onFileRemoved,
    discardDraft,
    publishDraft,
    isUploadingMedia,
    isPublishing,
    isRemovingMedia,
  } = useDraftPost({ onPostCreated, onError: handleServerError });

  // --- Mobile step navigation ---

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleNext = useCallback(
    async (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
      if (activeStep === 0) {
        if (files.length === 0) {
          onFilesError("Please upload at least one image or video before continuing.");
          return;
        }
        // Upload runs in the background — advance immediately so the user can
        // fill in the form while media uploads. The Post button is disabled
        // until the draft is ready.
        setActiveStep((prev) => Math.min(prev + 1, MOBILE_STEP_COUNT - 1));
        return;
      }

      const isValid = await methods.trigger(mobileStepFields[activeStep]);
      if (!isValid) return;

      clearServerError();
      setActiveStep((prev) => Math.min(prev + 1, MOBILE_STEP_COUNT - 1));
    },
    [activeStep, clearServerError, methods],
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
    clearServerError();

    if (files.length === 0) {
      onFilesError("Please upload at least one image or video before continuing.");
      return;
    }

    const currentDraftId = draftPostIdRef.current;
    if (!currentDraftId) {
      onFilesError("Media upload is still in progress. Please wait and try again.");
      return;
    }

    publishDraft(currentDraftId, values);
  };

  return {
    methods,
    activeStep,
    handleNext,
    handleBack,
    onFilesAdded,
    onFileRemoved,
    discardDraft,
    serverErrorMessage,
    clearServerError,
    handleSubmit,
    isSubmitting: isPublishing,
    isUploadingMedia,
    isRemovingMedia,
  };
}
