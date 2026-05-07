import { View, FlatList, StyleSheet, Dimensions } from "react-native";
import { useMemo } from "react";
import { Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
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
};

export function MediaPicker({
  media,
  selectedAssets,
  activeAlbum,
  onAlbumChange,
  onToggleAsset,
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
      {carouselItems.length > 0 ? (
        <MediaCarousel items={carouselItems} />
      ) : (
        <View style={[styles.placeholder, { borderColor: theme.colors.outlineVariant }]}>
          <SymbolView
            name="photo.on.rectangle"
            size={32}
            tintColor={theme.colors.onSurfaceVariant}
          />
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>
            Select photos and videos
          </Text>
        </View>
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
  placeholder: {
    aspectRatio: 8 / 7,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pickerSection: {
    flex: 1,
    gap: 16,
  },
});
