import type { DropzoneRootProps } from "react-dropzone";
import { get, useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { ActionButtons } from "@/components/create/ActionButtons";
import { CreateFormHeader } from "@/components/create/CreateFormHeader";
import { TitleFormInput } from "@/components/create/FormInputs";
import { UploadArea } from "@/components/create/UploadArea";
import { SortableImageGrid } from "@/components/create/desktop/SortableImageGrid";

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
  const {
    register,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<CreateFormSchemaTypes>();

  const conditionOptions = [
    { label: "Mint", value: 0 },
    { label: "Good", value: 1 },
    { label: "Fair", value: 2 },
  ] as const;

  const conditionValue = watch("condition");
  const isTradable = watch("availableForTrade") ?? false;

  return (
    <Stack
      width="100%"
      maxWidth={1280}
      direction="row"
      justifyContent="center"
      marginX="auto"
      paddingX={{ xs: 2, md: 4 }}
      paddingY={3}
      alignItems="flex-start"
      flex={1}
    >
      <Stack width="100%" gap={3}>
        <CreateFormHeader
          rightAction={
            <Button variant="text" type="button">
              Clear post
            </Button>
          }
        />

        <Stack direction="row" gap={{ xs: 3, md: 6 }} width="100%" alignItems="flex-start">
          <Stack flex={2} gap={2}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                minHeight: 520,
                borderRadius: 3,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "transparent",
              }}
            >
              {files.length > 0 ? (
                <SortableImageGrid files={files} removeFile={removeFile} onReorder={reorderFiles} />
              ) : (
                <UploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
              )}
            </Paper>

            <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
              We recommend using high quality .jpg files less than 20 MB or .mp4 files less than 200
              MB.
            </Typography>
          </Stack>

          <Stack gap={3} flex={3} width="auto" maxWidth={760} minWidth={0}>
            <TitleFormInput label="Title" placeholder="e.g. Mint Charizard holo, PSA 9" />

            <TextField
              {...register("description")}
              label="Description"
              placeholder="Describe condition, notable details, and what makes this collectible special"
              multiline
              rows={5}
              fullWidth
              variant="outlined"
              error={!!get(errors, "description")}
              helperText={get(errors, "description")?.message as string | undefined}
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

            <Stack gap={2}>
              <FormControl error={!!get(errors, "condition")}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Condition
                </Typography>
                <Stack direction="row" gap={1}>
                  {conditionOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      color={conditionValue === option.value ? "primary" : "default"}
                      variant={conditionValue === option.value ? "filled" : "outlined"}
                      onClick={() => {
                        setValue("condition", option.value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  ))}
                </Stack>
                <FormHelperText>
                  {get(errors, "condition")?.message as string | undefined}
                </FormHelperText>
              </FormControl>

              <Paper
                variant="outlined"
                sx={{
                  padding: isTradable ? 2 : 0,
                  backgroundColor: isTradable ? undefined : "transparent",
                  border: isTradable ? undefined : "none",
                }}
              >
                <Stack gap={1.5}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isTradable}
                        onChange={(event) => {
                          setValue("availableForTrade", event.target.checked, {
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                      />
                    }
                    label="Available for trade"
                  />

                  <TextField
                    {...register("lookingFor")}
                    label="What are you looking for?"
                    placeholder="e.g. Blastoise cards, sealed booster packs, vintage items"
                    fullWidth
                    size="small"
                    disabled={!isTradable}
                    error={!!get(errors, "lookingFor")}
                    helperText={get(errors, "lookingFor")?.message as string | undefined}
                  />
                </Stack>
              </Paper>
            </Stack>

            <ActionButtons isSubmitting={isSubmitting} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
