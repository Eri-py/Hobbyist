import { Stack } from "expo-router";

import { useCreateContext } from "@/hooks/create/useCreate";
import { ThemedView } from "@/components/shared/views/ThemedView";
import { MediaPicker } from "@/components/create/MediaPicker";
import { CreateForm } from "@/components/create/CreateForm";

export default function CreateScreen() {
  const {
    media,
    selectedAssets,
    toggleAsset,
    loadMore,
    mediaError,
    activeStep,
    handleNext,
    handleBack,
    handleClose,
    handleSubmit,
  } = useCreateContext();

  return (
    <>
      <Stack.Toolbar placement="left">
        {activeStep === 0 ? (
          <Stack.Toolbar.Button icon="xmark" onPress={handleClose} />
        ) : (
          <Stack.Toolbar.Button icon="chevron.backward" onPress={handleBack} />
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
          <Stack.Toolbar.Button variant="done" icon="checkmark" onPress={handleSubmit} />
        )}
      </Stack.Toolbar>

      <ThemedView style={{ gap: 16 }}>
        {activeStep === 0 && (
          <MediaPicker
            media={media}
            selectedAssets={selectedAssets}
            onToggleAsset={toggleAsset}
            onEndReached={loadMore}
            mediaError={mediaError}
          />
        )}
        {activeStep === 1 && <CreateForm selectedAssets={selectedAssets} />}
      </ThemedView>
    </>
  );
}
