import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

export type ValidActiveAlbumTypes = "Recents" | "Videos" | "Favorites";

export function useCreate() {
  const router = useRouter();
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [media, setMedia] = useState<MediaLibrary.Asset[]>();
  const [activeAlbum, setActiveAlbum] = useState<ValidActiveAlbumTypes>("Recents");

  const onCreateClick = async () => {
    if (permission?.granted) {
      router.push("/(create)");
      return;
    }
    if (permission?.canAskAgain === false) {
      Linking.openSettings();
      return;
    }
    const result = await requestPermission();
    if (result.granted) {
      router.push("/(create)");
    }
  };

  const setAlbum = (album: ValidActiveAlbumTypes) => setActiveAlbum(album);

  useEffect(() => {
    (async () => {
      const permission = await MediaLibrary.getPermissionsAsync();

      if (permission.granted) {
        const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });

        albums.map(async (album) => {
          if (album.title === activeAlbum) {
            const { assets } = await MediaLibrary.getAssetsAsync({
              mediaType: ["photo", "video"],
              sortBy: MediaLibrary.SortBy.creationTime,
              first: 100,
              album: album,
            });
            setMedia(assets);
          }
        });
      }
    })();
  }, [activeAlbum]);

  return { onCreateClick, media, activeAlbum, setAlbum };
}
