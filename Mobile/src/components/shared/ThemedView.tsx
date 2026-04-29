import { View, type ViewProps, StyleSheet, Keyboard } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ThemedViewProps = ViewProps & {
  safeArea?: boolean;
  mode?: "default" | "keyboard";
  contentContainerStyle?: object;
};

export function ThemedView({
  style,
  children,
  safeArea = false,
  mode = "default",
  contentContainerStyle,
  ...props
}: ThemedViewProps) {
  const theme = useTheme();
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const safeAreaStyle = safeArea
    ? {
        paddingTop: insets.top,
        paddingBottom: keyboardVisible ? 0 : insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : {};

  const baseStyle = [
    { backgroundColor: theme.colors.background },
    isTablet && { paddingTop: insets.top },
    safeAreaStyle,
  ];

  if (mode === "keyboard") {
    return (
      <KeyboardAwareScrollView
        style={[styles.container, ...baseStyle, style]}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  return (
    <View style={[styles.container, ...baseStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
