import type { DropzoneRootProps } from "react-dropzone";
import { useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { MobileImageDisplay } from "./MobileImageDisplay";
import { MobileUploadArea } from "./MobileUploadArea";

type MobileCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
  activeStep: number;
  isSubmitting: boolean;
};

export function MobileCreateForm({
  files,
  getRootProps,
  removeFile,
  reorderFiles,
  activeStep,
  isSubmitting,
}: MobileCreateFormProps) {
  const theme = useTheme();
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  return (
    <Stack flex={1} gap={2}>
      {activeStep === 0 && (
        <>
          {files.length > 0 ? (
            <MobileImageDisplay
              files={files}
              getRootProps={getRootProps}
              removeFile={removeFile}
              reorderFiles={reorderFiles}
            />
          ) : (
            <MobileUploadArea getRootProps={getRootProps} />
          )}

          <Paper elevation={0} sx={{ padding: 2 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Tip: Add multiple photos to show different angles
            </Typography>
          </Paper>
        </>
      )}

      {activeStep === 1 && (
        <Stack gap={2}>
          <TextField
            {...register("title")}
            variant="outlined"
            label="Title"
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          <TextField
            {...register("description")}
            label="Description"
            multiline
            rows={6}
            fullWidth
            placeholder="Type description here..."
            variant="outlined"
            error={!!errors.description}
            helperText={errors.description?.message}
            slotProps={{
              htmlInput: {
                sx: {
                  resize: "vertical",
                  overflow: "auto",
                  maxHeight: 500,
                },
              },
            }}
          />
        </Stack>
      )}

      {activeStep === 2 && (
        <Stack gap={2}>
          <FormControl fullWidth error={!!errors.condition}>
            <InputLabel id="condition-select-label">Condition</InputLabel>
            <Select
              {...register("condition")}
              labelId="condition-select-label"
              id="condition-select"
              label="Condition"
              defaultValue=""
            >
              <MenuItem value={0}>Mint</MenuItem>
              <MenuItem value={1}>Good</MenuItem>
              <MenuItem value={2}>Okay</MenuItem>
              <MenuItem value={3}>Poor</MenuItem>
            </Select>
            {errors.condition && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                {errors.condition.message}
              </Typography>
            )}
          </FormControl>

          <Paper sx={{ borderRadius: 3, width: "100%", padding: 2 }}>
            <FormControlLabel
              control={<Checkbox {...register("availableForTrade")} />}
              label="Available for trade"
            />

            <Stack
              border={`1px groove ${theme.palette.primary.main}`}
              borderRadius={3}
              padding={2}
              gap={1}
            >
              <Typography>What are you looking for?</Typography>
              <TextField
                {...register("lookingFor")}
                fullWidth
                placeholder="e.g. Blastoise cards, sealed booster packs, vintage items"
                error={!!errors.lookingFor}
                helperText={errors.lookingFor?.message}
              />
            </Stack>
          </Paper>

          <Button variant="contained" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
