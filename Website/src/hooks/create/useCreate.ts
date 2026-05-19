import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { useServerError, type ServerError } from "@hobbyist/hooks";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import { axiosInstance } from "@/api/axiosInstance";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";

// --- Types ---

type CreatePostResponse = components["schemas"]["CreatePostResponse"];
type CreateDraftResponse = components["schemas"]["CreateDraftResponse"];

// --- API ---

const createPostApi = (files: File[], values: CreateFormSchemaTypes) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("media", f));
  formData.append("hobby", values.hobby);
  formData.append("title", values.title ?? "");
  formData.append("description", values.description ?? "");
  formData.append("availableForTrade", String(values.availableForTrade));
  if (values.lookingFor) {
    formData.append("lookingFor", values.lookingFor);
  }
  return axiosInstance.post<CreatePostResponse>("posts/create", formData);
};

const saveDraftApi = (files: File[], values: CreateFormSchemaTypes) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("media", f));
  // All form fields are optional on a draft — only send non-empty values.
  if (values.title) formData.append("title", values.title);
  if (values.description) formData.append("description", values.description);
  if (values.hobby) formData.append("hobby", values.hobby);
  formData.append("availableForTrade", String(values.availableForTrade));
  if (values.lookingFor) formData.append("lookingFor", values.lookingFor);
  return axiosInstance.post<CreateDraftResponse>("posts/draft", formData);
};

// --- Mobile step config ---

const mobileStepFields: Record<number, (keyof CreateFormSchemaTypes)[]> = {
  0: [],
  1: ["hobby", "title", "description", "availableForTrade", "lookingFor"],
};

const MOBILE_STEP_COUNT = Object.keys(mobileStepFields).length;

// --- Hook ---

export function useCreate(onPostCreated: (postId: string) => void) {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();

  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      hobby: "",
      title: "",
      description: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: ({ files, values }: { files: File[]; values: CreateFormSchemaTypes }) =>
      createPostApi(files, values),
    onSuccess: (response) => onPostCreated(response.data.postId),
    onError: (error: ServerError) => handleServerError(error),
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ files, values }: { files: File[]; values: CreateFormSchemaTypes }) =>
      saveDraftApi(files, values),
    onError: (error: ServerError) => handleServerError(error),
  });

  // --- Mobile step navigation ---

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleNext = useCallback(
    async (files: FileWithMetadata[], onFilesError: (message: string) => void) => {
      if (activeStep === 0) {
        if (files.length === 0) {
          onFilesError("Please upload at least one image or video before continuing.");
          return;
        }
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

    createPostMutation.mutate({ files: files.map((f) => f.file), values });
  };

  // --- Draft save (called by navigation blocker dialog) ---

  const saveDraft = useCallback(
    (files: FileWithMetadata[]) =>
      saveDraftMutation.mutateAsync({
        files: files.map((f) => f.file),
        values: methods.getValues(),
      }),
    [methods, saveDraftMutation],
  );

  return {
    methods,
    activeStep,
    handleNext,
    handleBack,
    serverErrorMessage,
    clearServerError,
    handleSubmit,
    isSubmitting: createPostMutation.isPending,
    saveDraft,
    isSavingDraft: saveDraftMutation.isPending,
  };
}
