import { Link, type Href } from "expo-router";
import { Pressable, type PressableProps, type TextProps } from "react-native";
import { useTheme, Text } from "react-native-paper";

type ThemedLinkProps = {
  children: React.ReactNode;
  style?: TextProps["style"];
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

  // If onPress is provided, use Pressable with Text
  if (onPress) {
    return (
      <Pressable onPress={onPress} {...props}>
        <Text style={linkStyle}>{children}</Text>
      </Pressable>
    );
  }

  // Fallback to just styled text if neither is provided
  return <Text style={linkStyle}>{children}</Text>;
}
