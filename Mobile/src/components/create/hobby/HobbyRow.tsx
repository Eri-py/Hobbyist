import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";

type HobbyRowProps = {
  name: string;
  count: string;
  selected: boolean;
  onPress: () => void;
};

export function HobbyRow({ name, count, selected, onPress }: HobbyRowProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.colors.onSurface }]}>{name}</Text>
        <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>{count}</Text>
      </View>
      {selected && (
        <SymbolView name="checkmark" size={14} tintColor={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  count: {
    fontSize: 13,
  },
});
