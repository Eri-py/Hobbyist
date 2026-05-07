import { View } from "react-native";
import { Text } from "react-native-paper";

export function PostPreview() {
  return (
    <View style={{ borderWidth: 2, borderColor: "red", aspectRatio: 4 / 3, flex: 1 }}>
      <Text>Preview</Text>
    </View>
  );
}
