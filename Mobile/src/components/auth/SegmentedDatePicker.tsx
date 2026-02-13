import { View, StyleSheet } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import { Selector } from "../shared/Selector";

type SegmentedDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

const months = [
  { id: "01", label: "January" },
  { id: "02", label: "February" },
  { id: "03", label: "March" },
  { id: "04", label: "April" },
  { id: "05", label: "May" },
  { id: "06", label: "June" },
  { id: "07", label: "July" },
  { id: "08", label: "August" },
  { id: "09", label: "September" },
  { id: "10", label: "October" },
  { id: "11", label: "November" },
  { id: "12", label: "December" },
];

export function SegmentedDatePicker({ value, onChange, error }: SegmentedDatePickerProps) {
  const theme = useTheme();
  const [year, month, day] = value ? value.split("-") : ["", "", ""];

  const handleDayChange = (newDay: string) => {
    // Only allow numbers
    if (newDay === "" || /^\d+$/.test(newDay)) {
      // Pad single digit days with leading zero
      const paddedDay = newDay.length === 1 ? `0${newDay}` : newDay;
      onChange(`${year}-${month}-${paddedDay}`);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    if (newMonth) {
      onChange(`${year}-${newMonth}-${day}`);
    }
  };

  const handleYearChange = (newYear: string) => {
    if (newYear === "" || /^\d+$/.test(newYear)) {
      onChange(`${newYear}-${month}-${day}`);
    }
  };

  // Format day for display (remove leading zero for user input)
  const displayDay = day ? (day.startsWith("0") ? day.substring(1) : day) : "";

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          label="Day"
          value={displayDay}
          onChangeText={handleDayChange}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="DD"
          style={[styles.input, { flex: 1.5 }]}
          error={!!error}
          outlineColor={error ? theme.colors.error : undefined}
          activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <View style={[styles.monthContainer, { flex: 2.5 }]}>
          <Selector
            label="Month"
            value={month}
            onChange={handleMonthChange}
            menuItems={months}
            error={!!error}
          />
        </View>

        <TextInput
          mode="outlined"
          label="Year"
          value={year}
          onChangeText={handleYearChange}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="YYYY"
          style={[styles.input, { flex: 1.5 }]}
          error={!!error}
          outlineColor={error ? theme.colors.error : undefined}
          activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
          textColor={theme.colors.onSurface}
        />
      </View>

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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  monthContainer: {
    zIndex: 1000,
  },
  input: {
    backgroundColor: "transparent",
  },
  errorText: {
    marginTop: 4,
  },
});
