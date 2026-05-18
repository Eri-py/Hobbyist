import { createContext, useCallback, useContext, useRef, useState } from "react";
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
type CreateDraftResponse = components["schemas"]["CreateDraftResponse"];

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

const createDraftApi = (formData: FormData) =>
  axiosInstance.post<CreateDraftResponse>("posts/draft", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000,
  });

const publishPostApi = (postId: string, values: CreateFormSchemaTypes) =>
  axiosInstance.post<CreatePostResponse>(`posts/${postId}/publish`, values);

const discardDraftApi = (postId: string) => axiosInstance.delete(`posts/${postId}`);

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

  // --- Draft state ---

  const [draftPostId, setDraftPostId] = useState<string | null>(null);
  // Ref so handleBack and handleSubmit always read the latest ID without
  // needing it in their dependency arrays.
  const draftPostIdRef = useRef<string | null>(null);
  draftPostIdRef.current = draftPostId;

  // --- Queries ---

  const { data: hobbies = [], isLoading: isLoadingHobbies } = useQuery({
    queryKey: USER_HOBBIES_QUERY_KEY,
    queryFn: getUserHobbiesApi,
    staleTime: 15 * 60 * 1000,
  });

  // --- Mutations ---

  const createDraftMutation = useMutation({
    // Asset processing lives inside mutationFn so that isPending covers the
    // full operation (device I/O + compression + network upload), not just the
    // network leg. The step advances immediately on Next; this runs in the
    // background while the user fills in the form.
    mutationFn: async (assets: MediaLibrary.Asset[]) => {
      const resolvedAssets = await Promise.all(
        assets.map((asset) => MediaLibrary.getAssetInfoAsync(asset)),
      );
      const mediaItems = await processMediaForUpload(resolvedAssets);

      const formData = new FormData();
      mediaItems.forEach((item) => {
        formData.append("media", item as unknown as Blob);
      });

      return createDraftApi(formData);
    },
    onSuccess: (response) => {
      const postId = response.data.postId;
      setDraftPostId(postId);
      draftPostIdRef.current = postId;
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  const publishPostMutation = useMutation({
    mutationFn: ({ postId, values }: { postId: string; values: CreateFormSchemaTypes }) =>
      publishPostApi(postId, values),
    onSuccess: () => router.dismissAll(),
    onError: (error: ServerError) => handleServerError(error),
  });

  const discardDraftMutation = useMutation({
    mutationFn: (postId: string) => discardDraftApi(postId),
    onSuccess: () => {
      setDraftPostId(null);
      draftPostIdRef.current = null;
    },
    // Discard is best-effort — a failed discard is logged but not surfaced to the user
    // since they've already navigated away. The draft will expire on its own.
    onError: (error: ServerError) =>
      console.warn("Failed to discard draft — it will expire automatically.", error),
  });

  // --- Step navigation ---

  const handleNext = useCallback(() => {
    if (mediaPicker.selectedAssets.length === 0) return;
    // Fire upload in the background and advance immediately
    createDraftMutation.mutate(mediaPicker.selectedAssets);
    setActiveStep(1);
  }, [mediaPicker.selectedAssets, createDraftMutation]);

  const handleBack = useCallback(() => {
    methods.clearErrors();
    // Fire-and-forget: user navigates back immediately. Draft expires if discard fails.
    const currentDraftId = draftPostIdRef.current;
    if (currentDraftId) {
      discardDraftMutation.mutate(currentDraftId);
    }
    setActiveStep(0);
  }, [methods, discardDraftMutation]);

  // --- Submit ---

  const handleSubmit = methods.handleSubmit((values) => {
    clearServerError();
    const currentDraftId = draftPostIdRef.current;
    if (!currentDraftId) return;
    publishPostMutation.mutate({ postId: currentDraftId, values });
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
    isSubmitting: publishPostMutation.isPending,
    // Upload (processing + network) — used to disable the Next button
    isCreatingDraft: createDraftMutation.isPending,
    // Errors
    serverErrorMessage,
  };
}
