import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";

// Types for API requests
type CreatePostRequest = {
  title: string;
  description: string;
  condition: number;
  availableForTrade: boolean;
  lookingFor?: string;
  images: File[];
};

const createPostApi = async (data: CreatePostRequest) => {
  const formData = new FormData();

  // Add all form fields
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("condition", data.condition.toString());
  formData.append("availableForTrade", data.availableForTrade.toString());

  if (data.lookingFor) {
    formData.append("lookingFor", data.lookingFor);
  }

  // Add images
  data.images.forEach((image) => {
    formData.append(`images`, image);
  });

  return axiosInstance.post("posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Define which fields belong to each mobile step
const mobileSteps: Record<number, string[]> = {
  0: ["images"],
  1: ["title", "description"],
  2: ["condition", "availableForTrade", "lookingFor"],
};

export function useCreatePost() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [activeStep, setActiveStep] = useState<number>(0);

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => createPostApi(data),
    onSuccess: () => {},
    onError: (error: ServerError) => handleServerError(error),
  });

  // Handle mobile step navigation with validation
  const handleNext = async (
    trigger: (fields?: string | string[]) => Promise<boolean>,
    files: File[]
  ) => {
    const currentStepFields = mobileSteps[activeStep];

    // Special handling for image step
    if (activeStep === 0) {
      if (files.length === 0) {
        // You might want to set an error here
        return;
      }
      setActiveStep((prev) => Math.min(prev + 1, 2));
      return;
    }

    // Validate current step fields
    const isValid = await trigger(currentStepFields);

    if (isValid) {
      clearServerError();
      setActiveStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const handleSubmit = (
    formData: {
      title: string;
      description: string;
      condition: number;
      availableForTrade: boolean;
      lookingFor?: string;
    },
    files: File[]
  ) => {
    clearServerError();

    createPostMutation.mutate({
      title: formData.title,
      description: formData.description,
      condition: formData.condition,
      availableForTrade: formData.availableForTrade,
      lookingFor: formData.lookingFor,
      images: files,
    });
  };

  return {
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
