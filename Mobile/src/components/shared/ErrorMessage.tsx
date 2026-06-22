import { ReactNode } from "react";
import { View, Text } from "react-native";
import { SymbolView } from "expo-symbols";
import { useTheme } from "react-native-paper";

type ErrorMessageTypes = {
  children: ReactNode;
  fontSize?: number;
  iconSize?: number;
  color?: string;
  gap?: number;
};

export function ErrorMessage({
  children,
  fontSize = 16,
  iconSize = 24,
  color,
  gap = 2,
}: ErrorMessageTypes) {
  const theme = useTheme();
  const errorColor = color || theme.colors.error;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap }}>
      <SymbolView name="exclamationmark.circle" size={iconSize} tintColor={errorColor} />
      <Text style={{ fontSize, color: errorColor }}>{children}</Text>
    </View>
  );
}
