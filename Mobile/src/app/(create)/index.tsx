import * as MediaLibrary from "expo-media-library";
import { StyleSheet, Image, Button, View, Text } from "react-native";
import { useEffect, useState } from "react";

import { ThemedView } from "@/components/shared/ThemedView";

export default function Create() {
  const [albums, setAlbums] = useState<MediaLibrary.Album[] | null>(null);

  async function getAlbums() {
    const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    setAlbums(fetchedAlbums);
  }

  return (
    <View style={styles.container}>
      <Button onPress={getAlbums} title="Get albums" />
      <ThemedView>
        {albums && albums.map((album) => <AlbumEntry key={album.id} album={album} />)}
      </ThemedView>
    </View>
  );
}

type AlbumEntryTypes = {
  album: MediaLibrary.Album;
};

function AlbumEntry({ album }: AlbumEntryTypes) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    async function getAlbumAssets() {
      const albumAssets = await MediaLibrary.getAssetsAsync({ album });
      setAssets(albumAssets.assets);
    }
    getAlbumAssets();
  }, [album]);

  return (
    <View key={album.id} style={styles.albumContainer}>
      <Text>
        {album.title} - {album.assetCount ?? "no"} assets
      </Text>
      <View style={styles.albumAssetsContainer}>
        {assets &&
          assets.map((asset) => (
            <Image key={asset.id} source={{ uri: asset.uri }} width={50} height={50} />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  albumContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 4,
  },
  albumAssetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
