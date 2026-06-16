import { useState } from "react";
import { View, StyleSheet, Pressable, Modal, Platform } from "react-native";
import { TextInput, HelperText, useTheme, Surface, Text } from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { format, parse, isValid } from "date-fns";

type SegmentedDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function DatePicker({ value, onChange, error }: SegmentedDatePickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date(2000, 0, 1);
    const parsed = parse(dateString, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : new Date(2000, 0, 1);
  };

  const selectedDate = value ? parseDate(value) : new Date(2000, 0, 1);
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  const displayValue = value ? format(parseDate(value), "MMMM d, yyyy") : "";

  const handleOpen = () => {
    setTempDate(selectedDate);
    setOpen(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === "set" && date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleOpen}>
        <TextInput
          mode="outlined"
          label="Date of Birth"
          value={displayValue}
          editable={false}
          error={!!error}
          right={<TextInput.Icon icon="calendar" />}
          style={styles.input}
          outlineColor={error ? theme.colors.error : undefined}
          activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
          textColor={theme.colors.onSurface}
          pointerEvents="none"
        />
      </Pressable>

      {open && Platform.OS === "android" && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)} />
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
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
                <Pressable onPress={() => setOpen(false)} style={styles.modalButton}>
                  <Text style={[styles.modalButtonText, { color: theme.colors.primary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    onChange(format(tempDate, "yyyy-MM-dd"));
                  }}
                  style={styles.modalButton}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.primary }]}>
                    Done
                  </Text>
                </Pressable>
              </View>

              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={(_event, date) => {
                    if (date) setTempDate(date);
                  }}
                  themeVariant={theme.dark ? "dark" : "light"}
                />
              </View>
            </Surface>
          </View>
        </Modal>
      )}

      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
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
    paddingBottom: 12,
  },
  datePickerContainer: {
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 4,
  },
});
