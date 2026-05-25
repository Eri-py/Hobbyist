import { StyleSheet } from "react-native";

export const fieldStyles = StyleSheet.create({
  fieldRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  error: {
    fontSize: 12,
  },
});
