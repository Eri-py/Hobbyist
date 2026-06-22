import { StyleSheet } from "react-native";
import { Divider } from "react-native-paper";
import { type AssetInfo } from "expo-media-library";

import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";
import { MediaStrip } from "./MediaStrip";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { HobbyField } from "./fields/HobbyField";
import { TradeField } from "./fields/TradeField";

type CreateFormProps = {
  selectedAssets: AssetInfo[];
};

export function CreateForm({ selectedAssets }: CreateFormProps) {
  return (
    <ThemedKeyboardView contentContainerStyle={styles.content}>
      <MediaStrip selectedAssets={selectedAssets} />
      <TitleField />
      <Divider />
      <DescriptionField />
      <Divider />
      <HobbyField />
      <Divider />
      <TradeField />
      <Divider />
    </ThemedKeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
});
