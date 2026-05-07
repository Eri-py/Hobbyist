import { type ReactNode, useRef, useState, useEffect } from "react";
import { View, Pressable, StyleSheet, Animated } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Portal, useTheme } from "react-native-paper";

type GlassMenuProps = {
  visible: boolean;
  anchor: ReactNode;
  onDismiss: () => void;
  children: ReactNode;
};

export function GlassMenu({ visible, anchor, onDismiss, children }: GlassMenuProps) {
  const theme = useTheme();
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const anchorRef = useRef<View | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // screen-absolute coords needed since the Portal renders outside our view hierarchy
      anchorRef.current?.measureInWindow((x, y, _w, h) => {
        setLeft(x);
        setTop(y + h + 8); // 8px gap below the anchor
      });
    }

    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <View ref={anchorRef}>
      {anchor}
      {/* Portal renders above the ScrollView stacking context; needs a Portal.Host ancestor */}
      {visible && (
        <Portal>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
          <Animated.View style={[styles.popover, { top, left, opacity }]}>
            {/* Absolutely positioned so it doesn't affect content layout */}
            <GlassView
              pointerEvents="none"
              style={styles.glass}
              glassEffectStyle="clear"
              tintColor={theme.colors.surface}
            />
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: "absolute",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    padding: 4,
  },
  glass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 4,
  },
});
