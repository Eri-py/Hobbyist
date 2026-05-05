import { View, StyleSheet, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "react-native-paper";

type CircularProgressBarProps = {
  totalSteps: number;
  activeStep: number;
  size?: number;
};

export function CircularProgressBar({
  totalSteps,
  activeStep,
  size = 30,
}: CircularProgressBarProps) {
  const theme = useTheme();

  const fontSize = Math.round(size * 0.55);
  const stroke = size * 0.08; // scales stroke with size too
  const normalizedR = size - stroke;
  const circumference = 2 * Math.PI * normalizedR;
  const progress = totalSteps > 1 ? (activeStep / (totalSteps - 1)) * circumference : circumference;
  const dashOffset = circumference - progress;
  const displayStep = activeStep + 1;
  const diameter = size * 2;

  return (
    <View style={{ width: diameter, height: diameter }}>
      <View style={[styles.labelContainer, StyleSheet.absoluteFill]}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.onSurface, fontSize, lineHeight: fontSize * 1.2 },
          ]}
        >
          {displayStep}
        </Text>
      </View>
      <Svg width={diameter} height={diameter} style={styles.svg}>
        <Circle
          cx={size}
          cy={size}
          r={normalizedR}
          fill="none"
          stroke={theme.colors.outline}
          strokeWidth={stroke}
        />
        <Circle
          cx={size}
          cy={size}
          r={normalizedR}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    transform: [{ rotate: "-90deg" }],
  },
  labelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
