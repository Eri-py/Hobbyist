import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

type PostFooterProps = {
  likes: number;
  comments: number;
  shares: number;
  condition: string;
  tradable: boolean;
};

export function PostFooter({ likes, comments, shares, condition, tradable }: PostFooterProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Condition & Tradable Tags */}
      <View style={styles.tagsContainer}>
        {condition && (
          <View style={[styles.conditionTag, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
              {condition}
            </Text>
          </View>
        )}
        {tradable && (
          <View style={[styles.tradableTag, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text variant="labelSmall">Tradable</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {likes} Likes
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {comments} Comments
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {shares} Shares
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tradableTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
});
