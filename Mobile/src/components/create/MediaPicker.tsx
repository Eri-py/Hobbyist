import { StyleSheet, Dimensions } from "react-native";
import { useMemo } from "react";
import { FlashList } from "@shopify/flash-list";
import { Text, useTheme } from "react-native-paper";
import { MediaType, type Asset, type AssetInfo } from "expo-media-library";

import { MediaCarousel } from "@/components/shared/Media/MediaCarousel";
import { MediaItem } from "@/components/create/MediaItem";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

type MediaPickerProps = {
  media: Asset[];
  selectedAssets: AssetInfo[];
  onToggleAsset: (info: AssetInfo) => void;
  onEndReached: () => void;
  mediaError?: string | null;
};

export function MediaPicker({
  media,
  selectedAssets,
  onToggleAsset,
  onEndReached,
  mediaError,
}: MediaPickerProps) {
  const theme = useTheme();
  const carouselItems = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        // a.id is the ph:// reference expo-image/expo-video can load; a.uri is the file:// path (upload only).
        uri: a.id,
        mediaType: a.mediaType === MediaType.VIDEO ? ("video" as const) : ("photo" as const),
      })),
    [selectedAssets],
  );

  // O(1) lookup so each tile doesn't scan the whole selection on every render.
  const selectedIndexById = useMemo(() => {
    const map = new Map<string, number>();
    selectedAssets.forEach((a, i) => map.set(a.id, i));
    return map;
  }, [selectedAssets]);

  return (
    <>
      {carouselItems.length > 0 && <MediaCarousel items={carouselItems} />}

      {mediaError && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{mediaError}</Text>
      )}

      <FlashList
        style={styles.grid}
        data={media}
        extraData={selectedIndexById}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <MediaItem
            asset={item}
            size={ITEM_SIZE}
            selectedIndex={selectedIndexById.get(item.id) ?? null}
            onToggle={onToggleAsset}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    paddingHorizontal: 16,
  },
});
