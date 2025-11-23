import { View, StyleSheet } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";

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

      <Button
        mode="outlined"
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        icon={() => <AntDesign name="google" size={24} color="white" />}
      >
        <Text>{mode === "login" ? "Login with Google" : "Sign up with Google"}</Text>
      </Button>
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
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    gap: 8,
  },
});
