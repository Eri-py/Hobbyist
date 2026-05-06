import { type ViewProps, StyleSheet, Keyboard } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ThemedKeyboardViewProps = ViewProps & {
  safeArea?: boolean;
  contentContainerStyle?: object;
};

export function ThemedKeyboardView({
  style,
  children,
  safeArea = false,
  contentContainerStyle,
  ...props
}: ThemedKeyboardViewProps) {
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

  return (
    <KeyboardAwareScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isTablet && { paddingTop: insets.top },
        safeAreaStyle,
        style,
      ]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
