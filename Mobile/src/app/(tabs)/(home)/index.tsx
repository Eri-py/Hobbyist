import { Divider } from "react-native-paper";
import { ScrollView, View, StyleSheet } from "react-native";

import { ThemedView } from "@/components/shared/ThemedView";
import { PostTile, Post } from "@/components/home/PostTile";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { mockPosts } from "@/components/home/mockData";

export default function Home() {
  const { isTablet, isPhone } = useDeviceType();

  return (
    <ThemedView>
      <ScrollView
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    width: "100%",
    paddingVertical: 16,
  },
});
