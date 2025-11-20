import { Divider, Snackbar, useTheme, Text } from "react-native-paper";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/shared/ThemedView";
import { PostTile, Post } from "@/components/home/PostTile";
import { ScrollView, View } from "react-native";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { mockPosts } from "@/components/home/mockData";

const HomeScreen = () => {
  const { isTablet, isPhone } = useDeviceType();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const onDismissSnackBar = () => setSnackbarVisible(false);

  // Show snackbar only on first app startup
  useEffect(() => {
    setSnackbarVisible(true);
  }, []);

  const handleLoginPress = () => {
    router.replace("/login");
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          gap: isPhone ? 0 : 24,
          alignItems: isTablet ? "center" : undefined,
          width: "100%",
          paddingVertical: 16,
        }}
      >
        {mockPosts.map((post: Post, index: number) => (
          <View key={post.id}>
            <PostTile post={post} />
            {isPhone && index < mockPosts.length - 1 && <Divider />}
          </View>
        ))}
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        duration={1000000000000000}
        onDismiss={onDismissSnackBar}
        style={{
          backgroundColor: theme.colors.surface,
        }}
        wrapperStyle={{
          width: "100%",
          maxWidth: 650,
          alignSelf: "center",
        }}
        action={{
          label: "Login",
          onPress: handleLoginPress,
        }}
        onIconPress={onDismissSnackBar}
      >
        <Text>Please login to interact with posts</Text>
      </Snackbar>
    </ThemedView>
  );
};

export default HomeScreen;
