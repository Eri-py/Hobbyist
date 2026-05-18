import { TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";

import { GlassMenu } from "@/components/shared/GlassMenu";
import type { ValidActiveAlbumTypes } from "@/hooks/create/useCreate";

type AlbumPickerProps = {
  activeAlbum: ValidActiveAlbumTypes;
  onAlbumChange: (album: ValidActiveAlbumTypes) => void;
};

const ALBUMS: ValidActiveAlbumTypes[] = ["Recents", "Videos", "Favorites"];

function AlbumIcon({ album }: { album: ValidActiveAlbumTypes }) {
  const theme = useTheme();
  switch (album) {
    case "Recents":
      return <SymbolView name="clock" size={21} tintColor={theme.colors.onSurface} />;
    case "Videos":
      return <SymbolView name="play.circle" size={21} tintColor={theme.colors.onSurface} />;
    case "Favorites":
      return <SymbolView name="heart" size={21} tintColor={theme.colors.onSurface} />;
  }
}

export function AlbumPicker({ activeAlbum, onAlbumChange }: AlbumPickerProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <GlassMenu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.anchor}
        >
          <Text style={styles.anchorLabel}>{activeAlbum}</Text>
          <SymbolView
            name="chevron.down"
            size={15}
            tintColor={theme.colors.onSurface}
            style={styles.chevron}
          />
        </TouchableOpacity>
      }
    >
      {ALBUMS.map((album) => (
        <TouchableOpacity
          key={album}
          onPress={() => {
            onAlbumChange(album);
            setMenuVisible(false);
          }}
          style={styles.menuItem}
        >
          <AlbumIcon album={album} />
          <Text style={[styles.menuItemText, { color: theme.colors.onSurface }]}>
            {album}
          </Text>
        </TouchableOpacity>
      ))}
    </GlassMenu>
  );
}

const styles = StyleSheet.create({
  anchor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  anchorLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  chevron: {
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
