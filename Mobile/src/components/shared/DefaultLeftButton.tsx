import { useRouter, usePathname } from "expo-router";
import { Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export const DefaultLeftButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const isTradeActive = pathname.startsWith("/trade");

  return (
    <Pressable
      style={{ width: 36, aspectRatio: 1 / 1, alignItems: "center", justifyContent: "center" }}
      onPress={() => router.push("/(tabs)/trade")}
    >
      <Icon
        name="store-outline"
        size={28}
        color={isTradeActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
};
