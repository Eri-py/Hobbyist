import { ReactNode } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { darkTheme, lightTheme } from "@/themes/mainTheme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
