import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { useServerError, type ServerError } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";

// API function
const createPostApi = async (formData: FormData) => {
  return axiosInstance.post("posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- Mobile step configuration ---

// Define which form fields belong to each mobile step
const mobileStepFields: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [], // Images — handled separately (not a zod field)
  1: ["hobby", "title", "description", "availableForTrade", "lookingFor"],
};

const MOBILE_STEP_COUNT = Object.keys(mobileStepFields).length;

export function useCreate() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();

  // Initialize form methods
  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      hobby: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (formData: FormData) => createPostApi(formData),
    onSuccess: () => {},
    onError: (error: ServerError) => handleServerError(error),
  });

  // --- Mobile step logic ---

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleNext = useCallback(
    async (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
      const currentFields = mobileStepFields[activeStep];

      // Step 0: images — no zod fields, just check we have files
      if (activeStep === 0) {
        if (files.length === 0) {
          onFilesError("Please upload at least one image or video before continuing.");
          return;
        }
        setActiveStep((prev) => Math.min(prev + 1, MOBILE_STEP_COUNT - 1));
        return;
      }

      // Validate the current step's fields
      const isValid = await methods.trigger(currentFields);
      if (!isValid) return;

      clearServerError();
      setActiveStep((prev) => Math.min(prev + 1, MOBILE_STEP_COUNT - 1));
    },
    [activeStep, clearServerError, methods],
  );

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // --- Shared submit logic ---

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

    const formData = new FormData();

    formData.append("title", values.title);
    formData.append("hobby", values.hobby);
    formData.append("description", values.description);
    formData.append("availableForTrade", (values.availableForTrade ?? false).toString());

    if (values.lookingFor) {
      formData.append("lookingFor", values.lookingFor);
    }

    files.forEach((fileMetadata) => {
      formData.append("media", fileMetadata.file);
    });

    createPostMutation.mutate(formData);
  };

  return {
    // Form
    methods,

    // Mobile step navigation
    activeStep,
    handleNext,
    handleBack,

    // Errors
    serverErrorMessage,
    clearServerError,

    // Submit
    handleSubmit,

    // Mutation state
    isSubmitting: createPostMutation.isPending,
  };
}
