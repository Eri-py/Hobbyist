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
import { DesktopImageDisplay } from "./DesktopImageDisplay";
import { DesktopUploadArea } from "./DesktopUploadArea";

type DesktopCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  reorderFiles: (newOrder: FileWithMetadata[]) => void;
  isSubmitting: boolean;
};

export function DesktopCreateForm({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  reorderFiles,
  isSubmitting,
}: DesktopCreateFormProps) {
  const theme = useTheme();
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  return (
    <Stack maxWidth={700} width="100%" marginX="auto" gap={2}>
      <Paper
        sx={{
          display: "flex",
          width: "100%",
          aspectRatio: 5 / 2,
          borderRadius: 3,
          padding: files.length > 0 ? 3 : 0,
        }}
      >
        {files.length > 0 ? (
          <DesktopImageDisplay
            files={files}
            getRootProps={getRootProps}
            removeFile={removeFile}
            reorderFiles={reorderFiles}
          />
        ) : (
          <DesktopUploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
        )}
      </Paper>

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

      <Stack direction="row" gap={1} width="100%">
        <Button variant="outlined" size="large" sx={{ flex: 1 }} type="button">
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
          sx={{ flex: 1 }}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Post"}
        </Button>
      </Stack>
    </Stack>
  );
}
