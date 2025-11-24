import { Link, type Href } from "expo-router";
import { type ReactNode } from "react";
import { type PressableProps, type StyleProp, type TextStyle } from "react-native";
import { useTheme, Text } from "react-native-paper";

type ThemedLinkProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
} & (
  | {
      href: Href;
      onPress?: never;
    }
  | {
      href?: never;
      onPress: PressableProps["onPress"];
    }
);

export function ThemedLink({ style, children, href, onPress, ...props }: ThemedLinkProps) {
  const theme = useTheme();

  const linkStyle = [{ color: theme.colors.primary }, style];

  // If href is provided, use Link component
  if (href) {
    return (
      <Link style={linkStyle} href={href} {...props}>
        {children}
      </Link>
    );
  }

  // If onPress is provided, use Text with onPress
  if (onPress) {
    return (
      <Text style={linkStyle} onPress={onPress} {...props}>
        {children}
      </Text>
    );
  }

  // Fallback to just styled text if neither is provided
  return <Text style={linkStyle}>{children}</Text>;
}
