import { Image } from "expo-image";
import { StyleSheet, Dimensions, View, FlatList, TouchableOpacity } from "react-native";
import { Text, useTheme, Menu as PaperMenu } from "react-native-paper";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";

import { ThemedScrollView } from "@/components/shared/views/ThemedScrollView";
import { useCreate, ValidActiveAlbumTypes } from "@/hooks/create/useCreate";

const NUM_COLUMNS = 3;
const ITEM_SIZE = Dimensions.get("window").width / NUM_COLUMNS;
const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

const ALBUMS: ValidActiveAlbumTypes[] = ["Recents", "Videos", "Favorites"];

export default function Create() {
  const { media, activeAlbum, setAlbum } = useCreate();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <ThemedScrollView safeArea contentContainerStyle={styles.container}>
      <View style={{ borderWidth: 2, borderColor: "red", aspectRatio: 4 / 3, flex: 1 }}>
        <Text>Preview</Text>
      </View>

      <View style={{ gap: 16, alignSelf: "flex-start" }}>
        <PaperMenu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700" }}>{activeAlbum}</Text>
              <FontAwesome
                name="angle-down"
                size={18}
                color={theme.colors.onSurface}
                style={{ marginTop: 1 }}
              />
            </TouchableOpacity>
          }
        >
          {ALBUMS.map((album) => (
            <PaperMenu.Item
              key={album}
              title={album}
              onPress={() => {
                setAlbum(album);
                setMenuVisible(false);
              }}
            />
          ))}
        </PaperMenu>

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
                transition={500}
              />
            )}
          />
        )}
      </View>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  image: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
});
