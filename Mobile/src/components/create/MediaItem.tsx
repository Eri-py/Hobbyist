import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { MediaType, type Asset } from "expo-media-library";

type MediaItemProps = {
  item: Asset;
  size: number;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export function MediaItem({ item, size }: MediaItemProps) {
  const isVideo = item.mediaType === MediaType.video;

  return (
    <View style={{ width: size, height: size }}>
      <Image
        style={StyleSheet.absoluteFill}
        source={item.uri}
        placeholder={{ blurhash }}
        contentFit="cover"
        transition={250}
      />
      {isVideo && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDuration(item.duration)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
