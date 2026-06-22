import { View, StyleSheet, TouchableOpacity } from "react-native";
import { memo } from "react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Text, useTheme } from "react-native-paper";
import { MediaType, type Asset, type AssetInfo } from "expo-media-library";

import { useAssetInfo } from "@/components/shared/Media/assetMetadata";
import { useVideoThumbnail } from "@/components/shared/Media/videoThumbnails";

type MediaItemProps = {
  asset: Asset;
  size: number;
  selectedIndex: number | null;
  onToggle: (info: AssetInfo) => void;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Memoized so selecting one tile doesn't re-render every visible tile.
export const MediaItem = memo(function MediaItem({
  asset,
  size,
  selectedIndex,
  onToggle,
}: MediaItemProps) {
  const theme = useTheme();
  // Metadata (type/duration) resolves lazily per visible tile — no bulk getInfo on page load.
  const info = useAssetInfo(asset);
  const isVideo = info?.mediaType === MediaType.VIDEO;
  const isSelected = selectedIndex !== null;
  // Videos can't be drawn from their ph:// uri directly; use a generated poster frame.
  const thumbnail = useVideoThumbnail(asset.id, isVideo);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!info}
      onPress={() => info && onToggle(info)}
      style={[styles.tile, { width: size, height: size }]}
    >
      {isVideo ? (
        thumbnail ? (
          <Image
            style={StyleSheet.absoluteFill}
            source={thumbnail}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.videoFill]}>
            <SymbolView name="video.fill" size={22} tintColor="rgba(255,255,255,0.7)" />
          </View>
        )
      ) : info ? (
        <Image
          style={StyleSheet.absoluteFill}
          source={asset.id}
          contentFit="cover"
          transition={150}
        />
      ) : null}

      {isSelected && <View style={styles.dimOverlay} />}

      <View
        style={[
          styles.circle,
          isSelected && {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        {isSelected && <Text style={styles.circleNumber}>{selectedIndex + 1}</Text>}
      </View>

      {isVideo && info?.duration != null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDuration(info.duration / 1000)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  tile: {
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  videoFill: {
    backgroundColor: "rgba(80,80,80,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  dimOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(105,105,105,0.5)",
  },
  circle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    borderWidth: 1,
    borderColor: "white",
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleNumber: {
    color: "white",
    fontSize: 12,
    fontWeight: 700,
  },
  badge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});
