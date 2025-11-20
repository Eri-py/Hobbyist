import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { PostHeader } from "./PostHeader";
import { PostImage } from "./PostImage";
import { PostFooter } from "./PostFooter";

export type Post = {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
  condition: "Mint" | "Excellent" | "Good" | "Fair";
  tradable: boolean;
};

export function PostTile({ post }: { post: Post }) {
  const { isPhone, isTablet } = useDeviceType();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          aspectRatio: isPhone ? 7 / 9 : 9 / 5,
          backgroundColor: isTablet ? theme.colors.surface : "transparent",
        },
      ]}
    >
      <PostHeader
        userName={post.user.name}
        userAvatar={post.user.avatar}
        timestamp={post.timestamp}
        title={post.title}
      />

      <PostImage imageUrl={post.imageUrl} />

      <PostFooter
        likes={post.likes}
        comments={post.comments}
        shares={post.shares}
        condition={post.condition}
        tradable={post.tradable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    width: "100%",
    maxWidth: 650,
    padding: 16,
    gap: 12,
  },
});
