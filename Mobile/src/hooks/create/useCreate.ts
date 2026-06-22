import { Alert } from "react-native";
import { createContext, useCallback, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { axiosInstance } from "@/api/axiosInstance";
import { useCreatePost, appendPostFields, appendDraftFields } from "@hobbyist/hooks";

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

export { MAX_FILES } from "./useMediaPicker";

// --- Constants ---

export const USER_HOBBIES_QUERY_KEY = ["user-hobbies"] as const;

// --- Types ---

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

// --- Hook ---

export function useCreate() {
  const router = useRouter();
  const mediaPicker = useMediaPicker();
  const { methods, createPost, saveDraft } = useCreatePost(axiosInstance);
  const [activeStep, setActiveStep] = useState(0);

  // --- Queries ---

  const { data: hobbies = [], isLoading: isLoadingHobbies } = useQuery({
    queryKey: USER_HOBBIES_QUERY_KEY,
    queryFn: getUserHobbiesApi,
    staleTime: 15 * 60 * 1000,
  });

  // --- Step navigation ---

  const handleNext = useCallback(() => {
    if (mediaPicker.selectedAssets.length === 0) return;
    setActiveStep(1);
  }, [mediaPicker.selectedAssets.length]);

  const handleBack = useCallback(() => {
    setActiveStep(0);
  }, []);

  // --- Close with draft prompt ---

  const handleClose = useCallback(() => {
    if (mediaPicker.selectedAssets.length === 0) {
      router.back();
      return;
    }

    Alert.alert(
      "Save as draft?",
      "Would you like to save your post as a draft to finish later?",
      [
        { text: "Discard", style: "destructive", onPress: () => router.back() },
        {
          text: "Save Draft",
          onPress: () => {
            const assets = mediaPicker.selectedAssets;
            const values = methods.getValues();
            router.back();
            (async () => {
              try {
                const mediaItems = await processMediaForUpload(assets);
                const formData = new FormData();
                mediaItems.forEach((item) => {
                  formData.append("media", item as unknown as Blob);
                });
                appendDraftFields(formData, values);
                await saveDraft(formData);
              } catch {
                // silent — best-effort draft save
              }
            })();
          },
        },
      ],
    );
  }, [mediaPicker.selectedAssets, methods, router, saveDraft]);

  // --- Submit ---

  const handleSubmit = methods.handleSubmit((values) => {
    const assets = mediaPicker.selectedAssets;
    if (assets.length === 0) return;

    // Close the UI immediately — upload runs in the background
    router.dismissAll();

    (async () => {
      try {
        const mediaItems = await processMediaForUpload(assets);
        const formData = new FormData();
        mediaItems.forEach((item) => {
          formData.append("media", item as unknown as Blob);
        });
        appendPostFields(formData, values);
        createPost(formData);
      } catch {
        // silent — user will notice the post isn't on their profile
      }
    })();
  });

  return {
    // Media picker
    media: mediaPicker.media,
    selectedAssets: mediaPicker.selectedAssets,
    toggleAsset: mediaPicker.toggleAsset,
    loadMore: mediaPicker.loadMore,
    mediaError: mediaPicker.mediaError,
    // Step navigation
    activeStep,
    handleNext,
    handleBack,
    handleClose,
    // Form
    methods,
    // Hobby selection
    hobbies,
    isLoadingHobbies,
    // Submit
    handleSubmit,
  };
}
