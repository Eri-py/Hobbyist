import { View, StyleSheet } from "react-native";
import { Text, Divider } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";

import { ThemedButton } from "../shared/ThemedButton";

type OAuthButtonsTypes = {
  mode: "login" | "sign-up";
};

export function OAuthButtons({ mode }: OAuthButtonsTypes) {
  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <Divider style={styles.divider} />
        <Text variant="bodyMedium" style={styles.dividerText}>
          or
        </Text>
        <Divider style={styles.divider} />
      </View>

      <ThemedButton
        mode="outlined"
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        icon={() => <AntDesign name="google" size={24} color="white" />}
      >
        <Text>{mode === "login" ? "Login with Google" : "Sign up with Google"}</Text>
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 16,
    gap: 8,
  },
});
