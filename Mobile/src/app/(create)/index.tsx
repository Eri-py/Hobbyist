import { StyleSheet, Dimensions, View, FlatList, TouchableOpacity } from "react-native";
import { Portal, Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { MediaType } from "expo-media-library";

import { GlassMenu } from "@/components/shared/GlassMenu";
import { useCreate, ValidActiveAlbumTypes } from "@/hooks/create/useCreate";
import { ThemedView } from "@/components/shared/views/ThemedView";
import { MediaCarousel } from "@/components/shared/Media/MediaCarousel";
import { MediaItem } from "@/components/create/MediaItem";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

export default function Create() {
  const { media, activeAlbum, setAlbum, selectedAssets, toggleAsset } = useCreate();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const carouselItems = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === MediaType.video ? ("video" as const) : ("photo" as const),
      })),
    [selectedAssets],
  );

  const albums: ValidActiveAlbumTypes[] = ["Recents", "Videos", "Favorites"];
  const getAlbumIcon = (album: ValidActiveAlbumTypes) => {
    switch (album) {
      case "Recents":
        return <SymbolView name="clock" size={21} tintColor={theme.colors.onSurface} />;
      case "Videos":
        return <SymbolView name="play.circle" size={21} tintColor={theme.colors.onSurface} />;
      case "Favorites":
        return <SymbolView name="heart" size={21} tintColor={theme.colors.onSurface} />;
    }
  };

  return (
    <Portal.Host>
      <ThemedView safeArea style={styles.container}>
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

        <View style={{ gap: 16 }}>
          <GlassMenu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Text style={{ fontSize: 17, fontWeight: 500 }}>{activeAlbum}</Text>
                <SymbolView
                  name="chevron.down"
                  size={15}
                  tintColor={theme.colors.onSurface}
                  style={{ marginTop: 4 }}
                />
              </TouchableOpacity>
            }
          >
            {albums.map((album) => (
              <TouchableOpacity
                key={album}
                onPress={() => {
                  setAlbum(album);
                  setMenuVisible(false);
                }}
                style={styles.menuItem}
              >
                {getAlbumIcon(album)}
                <Text style={[styles.menuItemText, { color: theme.colors.onSurface }]}>
                  {album}
                </Text>
              </TouchableOpacity>
            ))}
          </GlassMenu>

          {media && (
            <FlatList
              data={media}
              keyExtractor={(item) => item.id}
              numColumns={NUM_COLUMNS}
              scrollEnabled={true}
              renderItem={({ item }) => {
                const idx = selectedAssets.findIndex((a) => a.id === item.id);
                return (
                  <MediaItem
                    item={item}
                    size={ITEM_SIZE}
                    selectedIndex={idx === -1 ? null : idx}
                    onPress={() => toggleAsset(item)}
                  />
                );
              }}
            />
          )}
        </View>
      </ThemedView>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
