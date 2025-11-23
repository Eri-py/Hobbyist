import { Controller, get, useFormContext } from "react-hook-form";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { SegmentedDatePicker } from "../SegmentedDatePicker";
import { FormTextField } from "../FormTextField";

type PersonalDetailsProps = {
  isPending: boolean;
};

export function PersonalDetails({ isPending }: PersonalDetailsProps) {
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

      <Button type="submit" variant="contained" size="large" loading={isPending}>
        Submit
      </Button>
    </Stack>
  );
}
