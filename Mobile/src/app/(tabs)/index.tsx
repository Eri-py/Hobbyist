import { Divider, Snackbar, useTheme, Text } from "react-native-paper";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView, View, StyleSheet } from "react-native";

import { ThemedView } from "@/components/shared/ThemedView";
import { PostTile, Post } from "@/components/home/PostTile";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { mockPosts } from "@/components/home/mockData";
import { useAuth } from "@hobbyist/hooks";

export default function Index() {
  const { isTablet, isPhone } = useDeviceType();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const onDismissSnackBar = () => setSnackbarVisible(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSnackbarVisible(true);
    }
  }, [isAuthenticated]);

  const handleLoginPress = () => {
    router.replace("/login");
  };

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

      {!isAuthenticated && (
        <Snackbar
          visible={snackbarVisible}
          duration={Infinity}
          onDismiss={onDismissSnackBar}
          style={{ backgroundColor: theme.colors.surface }}
          wrapperStyle={styles.snackbarWrapper}
          action={{
            label: "Login",
            onPress: handleLoginPress,
          }}
          onIconPress={onDismissSnackBar}
        >
          <Text>Please login to interact with posts</Text>
        </Snackbar>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    width: "100%",
    paddingVertical: 16,
  },
  snackbarWrapper: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
});
