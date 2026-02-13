import React, { ReactNode } from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
      <MaterialIcons name="error-outline" size={iconSize} color={errorColor} />
      <Text style={{ fontSize, color: errorColor }}>{children}</Text>
    </View>
  );
}
