import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { lightColors, darkColors } from "./colors";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    background: lightColors.background,
    surface: lightColors.surface,
    error: lightColors.error,
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onBackground: lightColors.text,
    onSurface: lightColors.text,
  },
  custom: lightColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    error: darkColors.error,
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onBackground: darkColors.text,
    onSurface: darkColors.text,
  },
  custom: darkColors,
};

export type AppTheme = typeof lightTheme;
