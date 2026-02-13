import { useState } from "react";
import { View, Modal, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { TextInput, Text, Surface, useTheme } from "react-native-paper";

type MenuItem = {
  id: string;
  label: string;
};

type SelectorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  menuItems: MenuItem[];
  error?: boolean;
};

export function Selector({ label, value, onChange, menuItems, error }: SelectorProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedLabel = menuItems.find((item) => item.id === value)?.label || "";

  return (
    <View style={styles.container}>
      {/* Input that opens the modal */}
      <TextInput
        mode="outlined"
        label={label}
        value={selectedLabel}
        editable={false}
        error={error}
        right={<TextInput.Icon icon="menu-down" />}
        onPressIn={() => setVisible(true)}
        style={styles.input}
        outlineColor={error ? theme.colors.error : theme.colors.outline}
        activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
      />

      {/* Bottom Positioned Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Overlay - closes modal when tapped */}
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setVisible(false)}
          />

          <Surface
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: theme.roundness * 2,
                borderTopRightRadius: theme.roundness * 2,
              },
            ]}
            elevation={2}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: theme.colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={menuItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.id === value && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    onChange(item.id);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.itemText, { color: theme.colors.onSurface }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    backgroundColor: "transparent",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  list: {
    maxHeight: 250,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  itemText: {
    fontSize: 16,
  },
});
