import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";

import type { Hobby } from "@/hooks/create/useCreate";
import { HobbyRow } from "./HobbyRow";

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k collectors`;
  return `${count} collectors`;
}

type HobbyListProps = {
  hobbies: Hobby[];
  selectedHobby: string | null;
  trimmedQuery: string;
  showAddRow: boolean;
  onSelect: (name: string) => void;
};

export function HobbyList({
  hobbies,
  selectedHobby,
  trimmedQuery,
  showAddRow,
  onSelect,
}: HobbyListProps) {
  const theme = useTheme();

  return (
    <View style={styles.list}>
      {showAddRow && (
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => onSelect(trimmedQuery)}
          activeOpacity={0.6}
        >
          <SymbolView name="plus" size={16} tintColor={theme.colors.onSurface} />
          <Text style={[styles.addLabel, { color: theme.colors.onSurface }]}>
            {`Add "${trimmedQuery}"`}
          </Text>
        </TouchableOpacity>
      )}

      {hobbies.length > 0 && (
        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>
          Your hobbies
        </Text>
      )}

      {hobbies.map((hobby) => (
        <HobbyRow
          key={hobby.name}
          name={hobby.name}
          count={formatCount(hobby.count)}
          selected={selectedHobby === hobby.name}
          onPress={() => onSelect(hobby.name)}
        />
      ))}

      {hobbies.length === 0 && !showAddRow && (
        <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
          {`No hobbies match "${trimmedQuery}"`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  addLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
});
