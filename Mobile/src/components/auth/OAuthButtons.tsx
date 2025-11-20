import { View } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";

type OAuthButtonsTypes = {
  mode: "login" | "sign-up";
};

export function OAuthButtons({ mode }: OAuthButtonsTypes) {
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Divider style={{ flex: 1 }} />
        <Text
          variant="bodyMedium"
          style={{
            marginHorizontal: 16,
            color: "#666",
          }}
        >
          or
        </Text>
        <Divider style={{ flex: 1 }} />
      </View>

      <Button
        mode="outlined"
        style={{
          borderRadius: 8,
        }}
        contentStyle={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 4,
        }}
        labelStyle={{
          fontSize: 16,
          gap: 8,
        }}
        icon={() => <AntDesign name="google" size={24} color="white" />}
      >
        <Text>{mode === "login" ? "Login with Google" : "Sign up with Google"}</Text>
      </Button>
    </View>
  );
}
