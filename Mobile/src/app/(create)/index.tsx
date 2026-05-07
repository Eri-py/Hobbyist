import { Stack, useRouter } from "expo-router";
import { FormProvider } from "react-hook-form";
import { Text, useTheme } from "react-native-paper";

import { useCreateContext } from "@/hooks/create/CreateContext";
import { ThemedView } from "@/components/shared/views/ThemedView";
import { MediaPicker } from "@/components/create/MediaPicker";
import { CreateForm } from "@/components/create/CreateForm";

export default function Create() {
  const router = useRouter();
  const {
    media,
    activeAlbum,
    setAlbum,
    selectedAssets,
    toggleAsset,
    activeStep,
    handleNext,
    handleBack,
    handleSubmit,
    selectedHobby,
    methods,
    isSubmitting,
    serverErrorMessage,
  } = useCreateContext();
  const theme = useTheme();

  return (
    <>
      <Stack.Toolbar placement="left">
        {activeStep === 0 ? (
          <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
        ) : (
          <Stack.Toolbar.Button
            icon="chevron.backward"
            onPress={handleBack}
            disabled={isSubmitting}
          />
        )}
      </Stack.Toolbar>

      <Stack.Toolbar placement="right">
        {activeStep === 0 ? (
          <Stack.Toolbar.Button
            icon="arrow.right"
            disabled={selectedAssets.length === 0}
            onPress={handleNext}
          />
        ) : (
          <Stack.Toolbar.Button variant="done" onPress={handleSubmit} disabled={isSubmitting}>
            Post
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>

      <ThemedView style={{ gap: 16 }}>
        {activeStep === 0 && (
          <MediaPicker
            media={media}
            selectedAssets={selectedAssets}
            activeAlbum={activeAlbum}
            onAlbumChange={setAlbum}
            onToggleAsset={toggleAsset}
          />
        )}
        {activeStep === 1 && (
          <FormProvider {...methods}>
            <CreateForm selectedAssets={selectedAssets} selectedHobby={selectedHobby} />
            {serverErrorMessage && (
              <Text style={{ color: theme.colors.error, paddingHorizontal: 16, paddingBottom: 12 }}>
                {serverErrorMessage}
              </Text>
            )}
          </FormProvider>
        )}
      </ThemedView>
    </>
  );
}
