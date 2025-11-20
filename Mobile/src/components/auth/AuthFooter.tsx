import { Text } from "react-native-paper";
import { View } from "react-native";
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
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 16,
          alignSelf: "center",
        }}
      >
        {currentContent.question}{" "}
        <ThemedLink href={currentContent.target as Href}>{currentContent.linkText}</ThemedLink>
      </Text>
      <Text
        style={{
          fontSize: 12,
          textAlign: "center",
          fontWeight: 200,
        }}
      >
        This site is protected by reCAPTCHA and the Google{" "}
        <ThemedLink href="">Privacy Policy</ThemedLink> and{" "}
        <ThemedLink href="">Terms of Service</ThemedLink> apply
      </Text>
    </View>
  );
}
