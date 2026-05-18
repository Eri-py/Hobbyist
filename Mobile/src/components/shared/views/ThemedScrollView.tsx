import { ScrollView, type ScrollViewProps, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ThemedScrollViewProps = ScrollViewProps & {
  safeArea?: boolean;
};

export function ThemedScrollView({
  style,
  contentContainerStyle,
  children,
  safeArea = false,
  ...props
}: ThemedScrollViewProps) {
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
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isTablet && { paddingTop: insets.top },
        style,
      ]}
      contentContainerStyle={[safeAreaStyle, contentContainerStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
