import { useRouter, usePathname } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export const DefaultLeftButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const isTradeActive = pathname.startsWith("/trade");

  return (
    <Pressable style={styles.button} onPress={() => router.push("/(tabs)/trade")}>
      <Icon
        name="store-outline"
        size={28}
        color={isTradeActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
