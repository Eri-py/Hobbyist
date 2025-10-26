import { Controller, get, useFormContext } from "react-hook-form";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { CustomFormHeader, CustomTextField, SegmentedDatePicker } from "../CustomInputs";

type PersonalDetailsProps = {
  isPending: boolean;
};

export function PersonalDetails({ isPending }: PersonalDetailsProps) {
  const { control } = useFormContext();

  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Personal details"
        subtext="Let's get to know a bit more about you :)"
        align="flex-start"
      />

      <CustomTextField
        type="text"
        label="Firstname"
        fieldValue="firstname"
        startIcon={<PersonOutlineIcon />}
        autoComplete="given-name"
        autoFocus
      />

      <CustomTextField
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
