import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

export function ThemedView({ style, children, ...props }: SafeAreaViewProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}
