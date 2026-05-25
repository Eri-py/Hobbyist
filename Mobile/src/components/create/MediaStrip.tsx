import { View, FlatList, StyleSheet } from "react-native";
import { useMemo } from "react";
import { Text } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { MediaType, type Asset } from "expo-media-library";

const THUMB_SIZE = 110;

type MediaStripProps = {
  selectedAssets: Asset[];
};

export function MediaStrip({ selectedAssets }: MediaStripProps) {
  const thumbnails = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === MediaType.video ? ("video" as const) : ("photo" as const),
      })),
    [selectedAssets],
  );

  if (thumbnails.length === 0) return null;

  return (
    <FlatList
      data={thumbnails}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      renderItem={({ item, index }) => (
        <View style={styles.thumb}>
          <Image source={item.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
          {item.mediaType === "video" && (
            <View style={styles.videoIcon}>
              <SymbolView name="play.fill" size={10} tintColor="white" />
            </View>
          )}
          {index === 0 && (
            <View style={styles.coverBadge}>
              <Text style={styles.coverText}>Cover</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.15)",
  },
  videoIcon: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});
