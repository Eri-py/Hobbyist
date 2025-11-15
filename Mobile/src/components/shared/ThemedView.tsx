import { View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

export function ThemedView({ style, children, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <View style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}
