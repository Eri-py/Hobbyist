import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { axiosInstance } from "@/api/axiosInstance";
import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { useServerError, type ServerError } from "@hobbyist/hooks";
import type { components } from "@hobbyist/types";

export type ValidActiveAlbumTypes = "Recents" | "Videos" | "Favorites";

export const MAX_FILES = 15;

export const USER_HOBBIES_QUERY_KEY = ["user-hobbies"] as const;

type CreatePostResponse = components["schemas"]["CreatePostResponse"];

// TODO: replace with axiosInstance.get<string[]>("user/hobbies") once endpoint exists
const getUserHobbiesApi = async (): Promise<string[]> => {
  return [
    "Photography",
    "Woodworking",
    "Model Railways",
    "Board Games",
    "Knitting",
    "Cycling",
    "Painting",
    "3D Printing",
  ];
};

const createPostApi = (formData: FormData) =>
  axiosInstance.post<CreatePostResponse>("posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000,
  });

export function useCreate() {
  const router = useRouter();
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();

  const [permission] = MediaLibrary.usePermissions();
  const [media, setMedia] = useState<MediaLibrary.Asset[]>();
  const [activeAlbum, setAlbum] = useState<ValidActiveAlbumTypes>("Recents");
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);

  const methods = useForm<CreateFormSchemaTypes>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      hobby: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });

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

  useEffect(() => {
    methods.setValue("hobby", selectedHobby ?? "", { shouldValidate: !!selectedHobby });
  }, [selectedHobby, methods]);

  const handleNext = () => {
    if (activeStep === 0 && selectedAssets.length === 0) return;
    setActiveStep((prev) => Math.min(prev + 1, 1));
  };

  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const toggleAsset = (asset: MediaLibrary.Asset) => {
    const isSelected = selectedAssets.some((a) => a.id === asset.id);
    if (isSelected) {
      setSelectedAssets((prev) => prev.filter((a) => a.id !== asset.id));
      return;
    }
    if (selectedAssets.length >= MAX_FILES) return;
    setSelectedAssets((prev) => [...prev, asset]);
  };

  const handleSubmit = methods.handleSubmit(async (values) => {
    clearServerError();

    const resolvedAssets = await Promise.all(
      selectedAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset)),
    );

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("hobby", values.hobby);
    formData.append("description", values.description);
    formData.append("availableForTrade", (values.availableForTrade ?? false).toString());
    if (values.lookingFor) {
      formData.append("lookingFor", values.lookingFor);
    }

    resolvedAssets.forEach((asset, index) => {
      const uri = asset.localUri ?? asset.uri;
      const ext =
        asset.filename?.split(".").pop() ??
        (asset.mediaType === MediaLibrary.MediaType.video ? "mp4" : "jpg");
      formData.append("media", {
        uri,
        name: asset.filename ?? `media_${index}.${ext}`,
        type: asset.mediaType === MediaLibrary.MediaType.video ? "video/mp4" : "image/jpeg",
      } as unknown as Blob);
    });

    createPostMutation.mutate(formData);
  });

  useEffect(() => {
    if (!permission?.granted) return;
    (async () => {
      const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      const album = albums.find((a) => a.title === activeAlbum);
      if (!album) return;
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo", "video"],
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 1000,
        album,
      });
      setMedia(assets);
    })();
  }, [activeAlbum, permission?.granted]);

  return {
    media,
    activeAlbum,
    setAlbum,
    selectedAssets,
    toggleAsset,
    activeStep,
    handleNext,
    handleBack,
    handleSubmit,
    hobbies,
    isLoadingHobbies,
    selectedHobby,
    setSelectedHobby,
    methods,
    isSubmitting: createPostMutation.isPending,
    serverErrorMessage,
  };
}
