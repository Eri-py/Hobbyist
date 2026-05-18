import { View, TextInput, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, Switch, Divider, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { Image } from "expo-image";
import { MediaType, type Asset } from "expo-media-library";
import { useRouter } from "expo-router";

import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

const THUMB_SIZE = 110;

function Row({
  icon,
  label,
  right,
  onPress,
}: {
  icon: SFSymbol;
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
      <SymbolView name={icon} size={20} tintColor={theme.colors.onSurface} />
      <Text style={[styles.rowLabel, { color: theme.colors.onSurface }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

type CreateFormProps = {
  selectedAssets: Asset[];
  selectedHobby: string | null;
};

export function CreateForm({ selectedAssets, selectedHobby }: CreateFormProps) {
  const theme = useTheme();
  const router = useRouter();
  const { control, formState: { errors } } = useFormContext<CreateFormSchemaTypes>();

  const placeholderColor = theme.colors.onSurfaceVariant;
  const textColor = theme.colors.onSurface;
  const errorColor = theme.colors.error;

  const thumbnails = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === MediaType.video ? ("video" as const) : ("photo" as const),
      })),
    [selectedAssets],
  );

  return (
    <ThemedKeyboardView contentContainerStyle={styles.content}>
      {thumbnails.length > 0 && (
        <FlatList
          data={thumbnails}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbStrip}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item, index }) => (
            <View style={styles.thumb}>
              <Image source={item.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
              {item.mediaType === "video" && (
                <View style={styles.videoIcon}>
                  <SymbolView name="play.fill" size={10} tintColor="white" />
                </View>
              )}
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverText}>Cover</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Add a title..."
            placeholderTextColor={placeholderColor}
            style={[styles.titleInput, { color: textColor }]}
            returnKeyType="next"
          />
        )}
      />
      {errors.title && (
        <Text style={[styles.error, { color: errorColor }]}>{errors.title.message}</Text>
      )}

      <Divider />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Add a description, mention condition, details and what makes this special..."
            placeholderTextColor={placeholderColor}
            style={[styles.descriptionInput, { color: textColor }]}
            multiline
            textAlignVertical="top"
          />
        )}
      />
      {errors.description && (
        <Text style={[styles.error, { color: errorColor }]}>{errors.description.message}</Text>
      )}

      <Divider />

      <Row
        icon="tag"
        label={selectedHobby ?? "Add a hobby"}
        right={
          selectedHobby ? (
            <SymbolView name="checkmark.circle.fill" size={18} tintColor={theme.colors.primary} />
          ) : (
            <SymbolView name="chevron.right" size={14} tintColor={theme.colors.onSurfaceVariant} />
          )
        }
        onPress={() => router.push("/(create)/hobby")}
      />
      {errors.hobby && (
        <Text style={[styles.error, { color: errorColor }]}>{errors.hobby.message}</Text>
      )}

      <Divider />

      <Controller
        control={control}
        name="availableForTrade"
        render={({ field: { value, onChange } }) => (
          <View>
            <Row
              icon="arrow.2.squarepath"
              label="Available for trade"
              right={
                <Switch value={value} onValueChange={onChange} style={styles.switch} />
              }
            />
            {value && (
              <Controller
                control={control}
                name="lookingFor"
                render={({ field: { value: lfValue, onChange: lfOnChange, onBlur: lfOnBlur } }) => (
                  <TextInput
                    value={lfValue}
                    onChangeText={lfOnChange}
                    onBlur={lfOnBlur}
                    placeholder="What are you looking for?"
                    placeholderTextColor={placeholderColor}
                    style={[styles.lookingForInput, { color: textColor }]}
                  />
                )}
              />
            )}
            {errors.lookingFor && (
              <Text style={[styles.error, { color: errorColor }]}>{errors.lookingFor.message}</Text>
            )}
          </View>
        )}
      />

      <Divider />
    </ThemedKeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
  thumbStrip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.15)",
  },
  videoIcon: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  descriptionInput: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 120,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  lookingForInput: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
