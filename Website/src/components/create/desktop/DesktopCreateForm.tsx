import type { DropzoneRootProps } from "react-dropzone";
import { get, useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
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
import { CreateTips } from "@/components/create/CreateTips";
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

  const titleValue = watch("title") || "";
  const conditionValue = watch("condition");
  const isTradable = watch("availableForTrade") ?? false;

  return (
    <Stack
      width="100%"
      maxWidth={1500}
      direction="row"
      justifyContent="space-between"
      marginX="auto"
      paddingX={4}
      paddingY={3}
      alignItems="stretch"
      flex={1}
    >
      <Stack gap={2} flex={1} width="auto" maxWidth={900} minWidth={0}>
        <CreateFormHeader rightAction={<Button variant="text">Clear</Button>} />

        <Stack gap={3}>
          <Stack flex={1} gap={3}>
            <Box sx={{ position: "relative" }}>
              <TextField
                {...register("title")}
                variant="outlined"
                placeholder="e.g. Mint Charizard holo, PSA 9"
                fullWidth
                error={!!get(errors, "title")}
                helperText={get(errors, "title")?.message as string | undefined}
              />
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  right: 12,
                  bottom: get(errors, "title") ? 24 : 8,
                  color: "text.secondary",
                  fontSize: "0.75rem",
                }}
              >
                {titleValue.length}/300
              </Typography>
            </Box>

            <Stack gap={1}>
              <Typography variant="h6">Images & Video</Typography>
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  minHeight: 150,
                  borderRadius: 2,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "transparent",
                }}
              >
                {files.length > 0 ? (
                  <SortableImageGrid
                    files={files}
                    removeFile={removeFile}
                    onReorder={reorderFiles}
                  />
                ) : (
                  <UploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
                )}
              </Paper>
            </Stack>

            <TextField
              {...register("description")}
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

                  {isTradable && (
                    <TextField
                      {...register("lookingFor")}
                      label="What are you looking for?"
                      placeholder="e.g. Blastoise cards, sealed booster packs, vintage items"
                      fullWidth
                      size="small"
                      error={!!get(errors, "lookingFor")}
                      helperText={get(errors, "lookingFor")?.message as string | undefined}
                    />
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Stack>

        <ActionButtons isSubmitting={isSubmitting} />
      </Stack>

      <Stack
        sx={{
          flex: 1,
          minWidth: 280,
          maxWidth: 420,
          height: "100%",

          p: 2,
        }}
      >
        <CreateTips />
      </Stack>
    </Stack>
  );
}
