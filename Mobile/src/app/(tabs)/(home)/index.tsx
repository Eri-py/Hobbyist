import { Divider } from "react-native-paper";
import { View, StyleSheet } from "react-native";

import { PostTile, Post } from "@/components/home/PostTile";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { mockPosts } from "@/components/home/mockData";
import { ThemedScrollView } from "@/components/shared/views/ThemedScrollView";

export default function Home() {
  const { isTablet, isPhone } = useDeviceType();

  return (
    <ThemedScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          gap: isPhone ? 0 : 24,
          alignItems: isTablet ? "center" : undefined,
        },
      ]}
    >
      {mockPosts.map((post: Post, index: number) => (
        <View key={post.id}>
          <PostTile post={post} />
          {isPhone && index < mockPosts.length - 1 && <Divider />}
        </View>
      ))}
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    width: "100%",
    paddingVertical: 16,
  },
});
