import { Controller, get, useFormContext } from "react-hook-form";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { SegmentedDatePicker } from "@/components/shared/SegmentedDatePicker";
import { FormTextField } from "../FormTextField";

type PersonalDetailsProps = {
  handleNext: () => void;
};

export function PersonalDetails({ handleNext }: PersonalDetailsProps) {
  const { control } = useFormContext();

  return (
    <Stack gap={1.5}>
      <FormTextField
        type="text"
        label="Firstname"
        fieldValue="firstname"
        startIcon={<PersonOutlineIcon />}
        autoComplete="given-name"
        autoFocus
      />

      <FormTextField
        type="text"
        label="Lastname"
        fieldValue="lastname"
        startIcon={<PersonOutlineIcon />}
        autoComplete="family-name"
      />

      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <SegmentedDatePicker
            value={value}
            onChange={onChange}
            error={get(errors, "dateOfBirth")?.message}
          />
        )}
      />

      <Button type="button" variant="contained" size="large" onClick={handleNext}>
        Continue
      </Button>
    </Stack>
  );
}
