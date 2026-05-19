import { View, FlatList, StyleSheet, Dimensions } from "react-native";
import { useMemo } from "react";
import { Text, useTheme } from "react-native-paper";
import { MediaType, type Asset } from "expo-media-library";

import { MediaCarousel } from "@/components/shared/Media/MediaCarousel";
import { MediaItem } from "@/components/create/MediaItem";
import { AlbumPicker } from "@/components/create/AlbumPicker";
import type { ValidActiveAlbumTypes } from "@/hooks/create/useCreate";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

type MediaPickerProps = {
  media: Asset[] | undefined;
  selectedAssets: Asset[];
  activeAlbum: ValidActiveAlbumTypes;
  onAlbumChange: (album: ValidActiveAlbumTypes) => void;
  onToggleAsset: (asset: Asset) => void;
  mediaError?: string | null;
};

export function MediaPicker({
  media,
  selectedAssets,
  activeAlbum,
  onAlbumChange,
  onToggleAsset,
  mediaError,
}: MediaPickerProps) {
  const theme = useTheme();
  const carouselItems = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === MediaType.video ? ("video" as const) : ("photo" as const),
      })),
    [selectedAssets],
  );

  return (
    <>
      {carouselItems.length > 0 && <MediaCarousel items={carouselItems} />}

      {mediaError && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{mediaError}</Text>
      )}

      <View style={styles.pickerSection}>
        <AlbumPicker activeAlbum={activeAlbum} onAlbumChange={onAlbumChange} />

        {media && (
          <FlatList
            data={media}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            renderItem={({ item }) => {
              const idx = selectedAssets.findIndex((a) => a.id === item.id);
              return (
                <MediaItem
                  item={item}
                  size={ITEM_SIZE}
                  selectedIndex={idx === -1 ? null : idx}
                  onPress={() => onToggleAsset(item)}
                />
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pickerSection: {
    flex: 1,
    gap: 16,
  },
  error: {
    fontSize: 13,
    paddingHorizontal: 16,
  },
});
