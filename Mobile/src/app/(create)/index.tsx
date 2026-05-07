import { Image } from "expo-image";
import { StyleSheet, Dimensions, View, FlatList, TouchableOpacity } from "react-native";
import { Portal, Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useState } from "react";

import { ThemedScrollView } from "@/components/shared/views/ThemedScrollView";
import { GlassMenu } from "@/components/shared/GlassMenu";
import { PostPreview } from "@/components/create/PostPreview";
import { useCreate, ValidActiveAlbumTypes } from "@/hooks/create/useCreate";

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = SCREEN_WIDTH / NUM_COLUMNS;
const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

const ALBUMS: ValidActiveAlbumTypes[] = ["Recents", "Videos", "Favorites"];

export default function Create() {
  const { media, activeAlbum, setAlbum } = useCreate();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

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
      <View style={styles.screen}>
        <ThemedScrollView safeArea contentContainerStyle={styles.container}>
          <PostPreview />

          <View style={{ gap: 16, alignSelf: "flex-start" }}>
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
              {ALBUMS.map((album) => (
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
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Image
                    style={styles.image}
                    source={item.uri}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={250}
                  />
                )}
              />
            )}
          </View>
        </ThemedScrollView>
      </View>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  image: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
});
