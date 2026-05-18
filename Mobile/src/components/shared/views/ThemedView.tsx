import { View, type ViewProps, type StyleProp, type ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ThemedViewProps = ViewProps & {
  safeArea?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ThemedView({
  style,
  children,
  safeArea = false,
  contentContainerStyle,
  ...props
}: ThemedViewProps) {
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
      {contentContainerStyle ? <View style={contentContainerStyle}>{children}</View> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
