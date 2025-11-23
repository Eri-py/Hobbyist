import { useRouter, usePathname } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export const DefaultRightButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const isSearchActive = pathname.startsWith("/search");

  return (
    <Pressable style={styles.button} onPress={() => router.push("/(tabs)/search")}>
      <Icon
        name="magnify"
        size={28}
        color={isSearchActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
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
