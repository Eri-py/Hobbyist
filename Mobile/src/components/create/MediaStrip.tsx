import { View, FlatList, StyleSheet } from "react-native";
import { useMemo } from "react";
import { Text } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { MediaType, type AssetInfo } from "expo-media-library";

import { useVideoThumbnail } from "@/components/shared/Media/videoThumbnails";

const THUMB_SIZE = 110;

type Thumb = { id: string; isVideo: boolean; isCover: boolean };

// id is the ph:// reference for display; videos need a generated poster frame.
function StripThumb({ id, isVideo, isCover }: Thumb) {
  const thumbnail = useVideoThumbnail(id, isVideo);
  return (
    <View style={styles.thumb}>
      <Image source={isVideo ? thumbnail : id} style={StyleSheet.absoluteFill} contentFit="cover" />
      {isVideo && (
        <View style={styles.videoIcon}>
          <SymbolView name="play.fill" size={10} tintColor="white" />
        </View>
      )}
      {isCover && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverText}>Cover</Text>
        </View>
      )}
    </View>
  );
}

type MediaStripProps = {
  selectedAssets: AssetInfo[];
};

export function MediaStrip({ selectedAssets }: MediaStripProps) {
  const thumbnails = useMemo<Thumb[]>(
    () =>
      selectedAssets.map((a, index) => ({
        id: a.id,
        isVideo: a.mediaType === MediaType.VIDEO,
        isCover: index === 0,
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
      renderItem={({ item }) => (
        <StripThumb id={item.id} isVideo={item.isVideo} isCover={item.isCover} />
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
