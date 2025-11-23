import { View, type ViewProps, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

export function ThemedView({ style, children, ...props }: ViewProps) {
  const theme = useTheme();
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  if (isTablet) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
