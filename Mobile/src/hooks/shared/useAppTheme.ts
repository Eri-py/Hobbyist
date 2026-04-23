import { useColorScheme } from "react-native";

import { darkColors, lightColors } from "@/themes/colors";

export type AppThemeColors = typeof lightColors;

export const useAppTheme = (): AppThemeColors => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
};
