import { StyleSheet, Dimensions, View, FlatList, TouchableOpacity } from "react-native";
import { Portal, Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useState } from "react";

import { GlassMenu } from "@/components/shared/GlassMenu";
import { MediaItem } from "@/components/create/MediaItem";
import { useCreate, ValidActiveAlbumTypes } from "@/hooks/create/useCreate";
import { ThemedView } from "@/components/shared/views/ThemedView";
import { PostPreview } from "@/components/create/PostPreview";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;

export default function Create() {
  const { media, activeAlbum, setAlbum } = useCreate();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

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
        <PostPreview />

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
              renderItem={({ item }) => <MediaItem item={item} size={ITEM_SIZE} />}
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
