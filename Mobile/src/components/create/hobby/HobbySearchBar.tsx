import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";

type HobbySearchBarProps = {
  query: string;
  onChangeQuery: (q: string) => void;
};

export function HobbySearchBar({ query, onChangeQuery }: HobbySearchBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.bar, { borderColor: theme.colors.outlineVariant }]}>
        <SymbolView name="magnifyingglass" size={16} tintColor={theme.colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search hobbies"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.input, { color: theme.colors.onSurface }]}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={50}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onChangeQuery("")} hitSlop={8}>
            <SymbolView
              name="xmark.circle.fill"
              size={16}
              tintColor={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
});
