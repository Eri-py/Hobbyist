import { Stack, useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";

import { useCreateContext } from "@/hooks/create/useCreate";
import { ThemedView } from "@/components/shared/views/ThemedView";
import { MediaPicker } from "@/components/create/MediaPicker";
import { CreateForm } from "@/components/create/CreateForm";

export default function CreateScreen() {
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
    isSubmitting,
    isCreatingDraft,
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
          <Stack.Toolbar.Button
            variant="done"
            icon="checkmark"
            onPress={handleSubmit}
            disabled={isSubmitting || isCreatingDraft}
          />
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
          <>
            <CreateForm selectedAssets={selectedAssets} />
            {serverErrorMessage && (
              <Text
                style={{ color: theme.colors.error, paddingHorizontal: 16, paddingBottom: 12 }}
              >
                {serverErrorMessage}
              </Text>
            )}
          </>
        )}
      </ThemedView>
    </>
  );
}
