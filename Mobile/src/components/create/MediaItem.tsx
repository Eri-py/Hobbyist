import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Text, useTheme } from "react-native-paper";
import { MediaType, type Asset } from "expo-media-library";

type MediaItemProps = {
  item: Asset;
  size: number;
  selectedIndex: number | null;
  onPress: () => void;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export function MediaItem({ item, size, selectedIndex, onPress }: MediaItemProps) {
  const theme = useTheme();
  const isVideo = item.mediaType === MediaType.video;
  const isSelected = selectedIndex !== null;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ width: size, height: size }}>
      <Image
        style={StyleSheet.absoluteFill}
        source={item.uri}
        placeholder={{ blurhash }}
        contentFit="cover"
        transition={250}
      />

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

      {isVideo && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDuration(item.duration)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
