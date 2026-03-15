import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import { useInterestsStep } from "@/hooks/auth/useInterestsStep";

type InterestsStepProps = {
  popularInterests: string[];
  isPending: boolean;
};

export function InterestsStep({ popularInterests, isPending }: InterestsStepProps) {
  const {
    interests,
    customInput,
    updateCustomInput,
    customInterests,
    interestsError,
    toggleCategory,
    addCustom,
    removeCustom,
    onInputKeyDown,
  } = useInterestsStep(popularInterests);

  return (
    <Stack gap={2}>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {popularInterests.map((name) => {
          const selected = interests.includes(name);
          return (
            <Chip
              key={name}
              label={name}
              onClick={() => toggleCategory(name)}
              variant={selected ? "filled" : "outlined"}
              color={selected ? "primary" : "default"}
              icon={selected ? <CheckIcon sx={{ fontSize: 16 }} /> : undefined}
              sx={{ fontSize: 13 }}
            />
          );
        })}
      </Stack>

      <Stack direction="row" gap={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a custom interest…"
          value={customInput}
          onChange={(e) => updateCustomInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <Button variant="outlined" onClick={addCustom} sx={{ whiteSpace: "nowrap" }}>
          + Add
        </Button>
      </Stack>

      {customInterests.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {customInterests.map((name) => (
            <Chip
              key={name}
              label={name}
              onDelete={() => removeCustom(name)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      {interestsError && (
        <Typography color="error" fontSize={13}>
          {interestsError}
        </Typography>
      )}

      <Button type="submit" variant="contained" size="large" loading={isPending}>
        Complete Sign Up
      </Button>
    </Stack>
  );
}
