import { View, type ViewProps, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ThemedViewProps = ViewProps & {
  safeArea?: boolean;
};

export function ThemedView({ style, children, safeArea = false, ...props }: ThemedViewProps) {
  const theme = useTheme();
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  const safeAreaStyle = safeArea
    ? {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : {};

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isTablet && { paddingTop: insets.top },
        safeAreaStyle,
        style,
      ]}
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
