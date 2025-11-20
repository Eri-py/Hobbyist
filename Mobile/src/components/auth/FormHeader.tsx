import { ReactNode } from "react";
import { FlexAlignType, View } from "react-native";
import { Text } from "react-native-paper";

type FormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  align: FlexAlignType;
};

export function FormHeader({ header, subtext, align }: FormHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <View>
        <Text style={{ fontWeight: 500, fontSize: 24 }}>{header}</Text>
        <Text style={{ fontWeight: 200, fontSize: 15 }}>{subtext}</Text>
      </View>
      <Text style={{ fontWeight: 200, fontSize: 15 }}>Step 1 / 4</Text>
    </View>
  );
}
