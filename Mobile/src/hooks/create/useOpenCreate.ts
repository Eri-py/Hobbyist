import { useCallback } from "react";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Linking } from "react-native";

export function useOpenCreate() {
  const router = useRouter();
  const [permission, requestPermission] = MediaLibrary.usePermissions();

  return useCallback(async () => {
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
  }, [permission, requestPermission, router]);
}
