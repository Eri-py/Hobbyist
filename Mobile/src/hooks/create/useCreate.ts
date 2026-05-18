import { createContext, useCallback, useContext, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { axiosInstance } from "@/api/axiosInstance";
import { useServerError, type ServerError } from "@hobbyist/hooks";
import type { components } from "@hobbyist/types";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { useMediaPicker, processMediaForUpload } from "./useMediaPicker";

// --- Context ---

type CreateContextValue = ReturnType<typeof useCreate>;

const CreateContext = createContext<CreateContextValue | null>(null);

export { CreateContext };

export function useCreateContext() {
  const ctx = useContext(CreateContext);
  if (!ctx) throw new Error("useCreateContext must be used within the create layout");
  return ctx;
}

// --- Re-exports for consumers ---

export type { ValidActiveAlbumTypes } from "./useMediaPicker";
export { MAX_FILES } from "./useMediaPicker";

// --- Constants ---

export const USER_HOBBIES_QUERY_KEY = ["user-hobbies"] as const;

// --- Types ---

type CreatePostResponse = components["schemas"]["CreatePostResponse"];

export type Hobby = {
  name: string;
  count: number;
};

// --- API ---

// TODO: replace with axiosInstance.get<Hobby[]>("user/hobbies") once endpoint exists
const getUserHobbiesApi = async (): Promise<Hobby[]> => {
  return [
    { name: "Photography", count: 4821 },
    { name: "Woodworking", count: 2340 },
    { name: "Model Railways", count: 1876 },
    { name: "Board Games", count: 3102 },
    { name: "Knitting", count: 2567 },
    { name: "Cycling", count: 1943 },
    { name: "Painting", count: 3814 },
    { name: "3D Printing", count: 1205 },
  ];
};

const createPostApi = (formData: FormData) =>
  axiosInstance.post<CreatePostResponse>("posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000,
  });

// --- Hook ---

export function useCreate() {
  const router = useRouter();
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const mediaPicker = useMediaPicker();
  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      hobby: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });
  const [activeStep, setActiveStep] = useState(0);

  const { data: hobbies = [], isLoading: isLoadingHobbies } = useQuery({
    queryKey: USER_HOBBIES_QUERY_KEY,
    queryFn: getUserHobbiesApi,
    staleTime: 15 * 60 * 1000,
  });

  const createPostMutation = useMutation({
    mutationFn: createPostApi,
    onSuccess: () => router.dismissAll(),
    onError: (error: ServerError) => handleServerError(error),
  });

  const handleNext = useCallback(() => {
    if (mediaPicker.selectedAssets.length === 0) return;
    setActiveStep(1);
  }, [mediaPicker.selectedAssets.length]);

  const handleBack = useCallback(() => {
    methods.clearErrors();
    setActiveStep(0);
  }, [methods]);

  const handleSubmit = methods.handleSubmit(async (values) => {
    clearServerError();

    const resolvedAssets = await Promise.all(
      mediaPicker.selectedAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset)),
    );

    const mediaItems = await processMediaForUpload(resolvedAssets);

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("hobby", values.hobby);
    formData.append("description", values.description);
    formData.append("availableForTrade", (values.availableForTrade ?? false).toString());
    if (values.lookingFor) {
      formData.append("lookingFor", values.lookingFor);
    }
    mediaItems.forEach((item) => {
      formData.append("media", item as unknown as Blob);
    });

    createPostMutation.mutate(formData);
  });

  return {
    // Media picker
    media: mediaPicker.media,
    activeAlbum: mediaPicker.activeAlbum,
    setAlbum: mediaPicker.setAlbum,
    selectedAssets: mediaPicker.selectedAssets,
    toggleAsset: mediaPicker.toggleAsset,
    // Step navigation
    activeStep,
    handleNext,
    handleBack,
    // Form
    methods,
    // Hobby selection
    hobbies,
    isLoadingHobbies,
    // Submit
    handleSubmit,
    isSubmitting: createPostMutation.isPending,
    // Errors
    serverErrorMessage,
  };
}
