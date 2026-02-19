import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";

import { Selector } from "@/components/shared/Selector";

type SegmentedDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function SegmentedDatePicker({ value, onChange, error }: SegmentedDatePickerProps) {
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

  let [year, month, day] = value ? value.split("-") : "".split("-");
  if (!day) day = "";
  if (!month) month = "";
  if (!year) year = "";

  const theme = useTheme();

  const handleDayChange = (newDay: string) => {
    if (newDay === "") onChange(`${year}-${month}-${""}`);
    else if (newDay.match("^[0-9]+$")) onChange(`${year}-${month}-${newDay}`);
  };

  const handleMonthChange = (newMonth: string) => {
    onChange(`${year}-${newMonth}-${day}`);
  };

  const handleYearChange = (newYear: string) => {
    if (newYear === "") onChange(`${""}-${month}-${day}`);
    else if (newYear.match("^[0-9]+$")) onChange(`${newYear}-${month}-${day}`);
  };

  return (
    <Stack>
      <Stack direction="row" gap={1.5}>
        <TextField
          type="text"
          variant="outlined"
          label="Day"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          autoComplete="off"
          sx={{ flex: 1.5 }}
          slotProps={{
            input: {
              sx: {
                gap: 1,
                backgroundColor: theme.palette.background.paper,
              },
            },
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
          }}
        />

        <Selector
          label="Month"
          value={month}
          onChange={handleMonthChange}
          menuItems={months}
          flex={2}
        />

        <TextField
          type="text"
          variant="outlined"
          label="Year"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          sx={{ flex: 1.5 }}
          autoComplete="off"
          slotProps={{
            input: {
              sx: {
                gap: 1,
                backgroundColor: theme.palette.background.paper,
              },
            },
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
          }}
        />
      </Stack>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Stack>
  );
}

type CustomFormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  align: string;
};

export function CustomFormHeader({ header, subtext, align }: CustomFormHeaderProps) {
  return (
    <Stack alignItems={align}>
      <Typography fontWeight={500} fontSize={24} color="textPrimary">
        {header}
      </Typography>
      <Typography fontWeight={200} fontSize={15} color="textSecondary" sx={{ textWrap: "nowrap" }}>
        {subtext}
      </Typography>
    </Stack>
  );
}
