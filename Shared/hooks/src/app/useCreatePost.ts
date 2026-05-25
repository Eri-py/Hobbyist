import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosInstance } from "axios";

import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";

type CreatePostResponse = components["schemas"]["CreatePostResponse"];
type CreateDraftResponse = components["schemas"]["CreateDraftResponse"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
export const MAX_FILES = 15;

// ---------------------------------------------------------------------------
// FormData helpers
// ---------------------------------------------------------------------------

export function appendPostFields(formData: FormData, values: CreateFormSchemaTypes): void {
  formData.append("hobby", values.hobby);
  formData.append("title", values.title);
  formData.append("description", values.description);
  formData.append("availableForTrade", String(values.availableForTrade));
  if (values.lookingFor) {
    formData.append("lookingFor", values.lookingFor);
  }
}

export function appendDraftFields(formData: FormData, values: CreateFormSchemaTypes): void {
  if (values.hobby) formData.append("hobby", values.hobby);
  if (values.title) formData.append("title", values.title);
  if (values.description) formData.append("description", values.description);
  formData.append("availableForTrade", String(values.availableForTrade));
  if (values.lookingFor) formData.append("lookingFor", values.lookingFor);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCreatePost(axiosInstance: AxiosInstance) {
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

  const saveDraftMutation = useMutation({
    mutationFn: (formData: FormData) =>
      axiosInstance.post<CreateDraftResponse>("posts/draft", formData, { timeout: 60_000 }),
  });

  const createPost = (formData: FormData) => {
    void axiosInstance.post<CreatePostResponse>("posts/create", formData, { timeout: 60_000 });
  };

  return {
    methods,
    createPost,
    saveDraft: (formData: FormData) => saveDraftMutation.mutateAsync(formData),
    isSavingDraft: saveDraftMutation.isPending,
  };
}
