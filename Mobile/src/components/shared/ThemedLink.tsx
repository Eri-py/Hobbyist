import { Link, LinkProps } from "expo-router";
import { useTheme } from "react-native-paper";

export function ThemedLink({ style, children, ...props }: LinkProps) {
  const theme = useTheme();

  return (
    <Link style={[{ color: theme.colors.primary }, style]} {...props}>
      {children}
    </Link>
  );
}
