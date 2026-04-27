import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { CircularProgressBar } from "@/components/shared/CircularProgressBar";

type FormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  currentStep: number;
  totalSteps: number;
};

export function FormHeader({ header, subtext, currentStep, totalSteps }: FormHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>{header}</Text>
        <Text style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}>{subtext}</Text>
      </View>
      <CircularProgressBar totalSteps={totalSteps} activeStep={currentStep} size={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
  },
  subText: {
    fontSize: 16,
  },
});
