import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@/schemas/CreateSchemas";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

// API function
const createPostApi = async (formData: FormData) => {
  return axiosInstance.post("posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Define which fields belong to each mobile step
const mobileSteps: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [], // Images handled separately
  1: ["title", "description"],
  2: ["condition", "availableForTrade", "lookingFor"],
};

export function useCreate() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [activeStep, setActiveStep] = useState<number>(0);

  // Initialize form methods
  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
  });

  const createPostMutation = useMutation({
    mutationFn: (formData: FormData) => createPostApi(formData),
    onSuccess: () => {},
    onError: (error: ServerError) => handleServerError(error),
  });

  // Handle mobile step navigation with validation
  const handleNext = useCallback(
    async (files: FileWithMetadata[]) => {
      const currentStepFields = mobileSteps[activeStep];

      // handling for image step
      if (activeStep === 0) {
        if (files.length === 0) {
          // TODO: Add error
          console.log("TODO: Add error for continue without images");
          return;
        }
        setActiveStep((prev) => Math.min(prev + 1, 2));
        return;
      }

      const isValid = await methods.trigger(currentStepFields);
      if (!isValid) {
        return;
      }

      clearServerError();
      setActiveStep((prev) => Math.min(prev + 1, 2));
    },
    [activeStep, clearServerError, methods]
  );

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Handle form submission
  const handleSubmit = (files: FileWithMetadata[]) => {
    clearServerError();

    const formData = new FormData();
    const values = methods.getValues();

    // Add all form fields
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("condition", values.condition.toString());
    formData.append("availableForTrade", (values.availableForTrade ?? false).toString());

    if (values.lookingFor) {
      formData.append("lookingFor", values.lookingFor);
    }

    // Add images - extract the actual File object from FileWithMetadata
    files.forEach((fileMetadata) => {
      formData.append("images", fileMetadata.file);
    });

    console.log(formData);

    // createPostMutation.mutate(formData);
  };

  return {
    // Form methods
    methods,

    // State
    activeStep,
    setActiveStep,

    // Server error handling
    serverErrorMessage,
    clearServerError,

    // Actions
    handleNext,
    handleBack,
    handleSubmit,

    // Mutation states
    isSubmitting: createPostMutation.isPending,
  };
}
