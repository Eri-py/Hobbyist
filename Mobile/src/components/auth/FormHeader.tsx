import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

type FormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  currentStep: string;
  totalSteps: string;
};

export function FormHeader({ header, subtext, currentStep, totalSteps }: FormHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.headerText}>{header}</Text>
        <Text style={styles.subText}>{subtext}</Text>
      </View>
      <Text style={styles.stepText}>
        Step {currentStep} / {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  headerText: {
    fontWeight: 500,
    fontSize: 24,
  },
  subText: {
    fontWeight: 200,
    fontSize: 15,
  },
  stepText: {
    fontWeight: 200,
    fontSize: 15,
  },
});
