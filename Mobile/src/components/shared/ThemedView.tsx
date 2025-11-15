import { View, type ViewProps } from "react-native";
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
          {
            backgroundColor: theme.colors.background,
            flex: 1,
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
    <View style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}
