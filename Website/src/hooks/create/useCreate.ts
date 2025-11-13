import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@/schemas/CreateSchemas";

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

export function useCreatePost() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [activeStep, setActiveStep] = useState<number>(0);

  // Initialize form methods
  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      condition: undefined,
      availableForTrade: false,
      lookingFor: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (formData: FormData) => createPostApi(formData),
    onSuccess: () => {},
    onError: (error: ServerError) => handleServerError(error),
  });

  // Handle mobile step navigation with validation
  const handleNext = async (files: File[]) => {
    const currentStepFields = mobileSteps[activeStep];

    // handling for image step
    if (activeStep === 0) {
      if (files.length === 0) {
        // TODO: Add error
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
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const handleSubmit = (files: File[]) => {
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

    // Add images
    files.forEach((image) => {
      formData.append("images", image);
    });

    createPostMutation.mutate(formData);
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
