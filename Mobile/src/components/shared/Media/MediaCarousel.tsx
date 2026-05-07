import { View, FlatList, StyleSheet, Dimensions } from "react-native";
import { useRef, useState } from "react";
import type { ViewToken } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";

import { VideoPlayer } from "@/components/shared/Media/VideoPlayer";

export type MediaItem = {
  id: string;
  uri: string;
  mediaType: "photo" | "video";
};

type MediaCarouselProps = {
  items: MediaItem[];
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export function MediaCarousel({ items }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeIndex = Math.min(currentIndex, items.length - 1);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item, index }) => (
          <View style={styles.slide}>
            {item.mediaType === "video" ? (
              <VideoPlayer uri={item.uri} isActive={index === safeIndex} />
            ) : (
              <Image style={StyleSheet.absoluteFill} source={item.uri} contentFit="contain" />
            )}
          </View>
        )}
      />
      {items.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {safeIndex + 1} / {items.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 8 / 7,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  slide: {
    width: SCREEN_WIDTH,
  },
  counter: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
