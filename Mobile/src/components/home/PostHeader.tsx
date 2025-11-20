import { View, StyleSheet } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";

type PostHeaderProps = {
  userName: string;
  userAvatar?: string;
  timestamp: string;
  title: string;
};

export function PostHeader({ userName, userAvatar, timestamp, title }: PostHeaderProps) {
  const theme = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderAvatar = () => {
    if (userAvatar) {
      return <Avatar.Image size={32} source={{ uri: userAvatar }} />;
    }

    return <Avatar.Text size={32} label={getInitials(userName)} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        {renderAvatar()}
        <View style={styles.userDetails}>
          <Text variant="bodyMedium" style={{ fontWeight: "600", color: theme.colors.onSurface }}>
            {userName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {timestamp}
          </Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text
          variant="titleMedium"
          style={{ fontWeight: "700", color: theme.colors.onSurface }}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 4,
  },
});
