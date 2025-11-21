import { Text } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { type Href } from "expo-router";

import { ThemedLink } from "../shared/ThemedLink";

type AuthFooterProps = {
  mode: "login" | "sign-up";
};

export function AuthFooter({ mode }: AuthFooterProps) {
  const footerContent = {
    login: {
      question: "Don't have an account?",
      linkText: "sign up here",
      target: "/sign-up",
    },
    "sign-up": {
      question: "Already have an account?",
      linkText: "login here",
      target: "/login",
    },
  };

  const currentContent = footerContent[mode];

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {currentContent.question}{" "}
        <ThemedLink href={currentContent.target as Href}>{currentContent.linkText}</ThemedLink>
      </Text>
      <Text style={styles.footerText}>
        This site is protected by reCAPTCHA and the Google{" "}
        <ThemedLink onPress={() => {}}>Privacy Policy</ThemedLink> and{" "}
        <ThemedLink onPress={() => {}}>Terms of Service</ThemedLink> apply
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  questionText: {
    fontSize: 16,
    alignSelf: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: 200,
  },
});
