import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Linking } from "react-native";

export function useCreate() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const router = useRouter();

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

  return { onCreateClick };
}
