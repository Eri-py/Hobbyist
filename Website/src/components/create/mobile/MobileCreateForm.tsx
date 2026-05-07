import type { DropzoneRootProps } from "react-dropzone";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ActionButtons } from "@/components/create/ActionButtons";
import { MobileHeader } from "@/components/create/mobile/MobileHeader";
import { FormInput, TradeOptionsFormInput } from "@/components/create/FormInputs";
import { MediaCarousel } from "@/components/create/MediaCarousel";
import { UploadArea } from "@/components/create/UploadArea";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";

const STEPS_LABELS = ["Images & Videos", "Details"];

type MobileCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  isDragActive: boolean;
  removeFile: (fileId: string) => void;
  isSubmitting: boolean;
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
};

export function MobileCreateForm({
  files,
  getRootProps,
  isDragActive,
  removeFile,
  isSubmitting,
  activeStep,
  onNext,
  onBack,
}: MobileCreateFormProps) {
  const { currentIndex, handlePrevious, handleNext, currentFile } = useMediaCarousel(files);

  return (
    <Stack
      direction="column"
      sx={{
        width: "100%",
        marginX: "auto",
        paddingBottom: 18,
        alignItems: "flex-start",
      }}
    >
      <Stack
        sx={{
          gap: 3,
          width: "100%",
          minWidth: 0,
        }}
      >
        <MobileHeader
          totalSteps={STEPS_LABELS.length}
          activeStep={activeStep}
          stepLabel={STEPS_LABELS[activeStep]}
          onNext={onNext}
          onBack={onBack}
        />
        <Stack
          sx={{
            gap: 3,
          }}
        >
          {activeStep === 0 && (
            <Stack
              sx={{
                gap: 1,
              }}
            >
              <Typography variant="subtitle2">Images and videos</Typography>

              <Box sx={{ width: "100%", aspectRatio: 4 / 3, minHeight: 250, display: "flex" }}>
                {files.length > 0 ? (
                  <MediaCarousel
                    currentFile={currentFile}
                    currentIndex={currentIndex}
                    totalFiles={files.length}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onRemove={removeFile}
                    getRootProps={getRootProps}
                    showCounter
                  />
                ) : (
                  <UploadArea getRootProps={getRootProps} isDragActive={isDragActive} />
                )}
              </Box>
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack
              sx={{
                gap: 2,
              }}
            >
              <FormInput
                field="hobby"
                label="Hobby"
                placeholder="e.g. Pokémon cards"
                size="small"
                helperText="One hobby per post."
              />

              <FormInput
                field="title"
                label="Title"
                placeholder="e.g. Mint Charizard holo, PSA 9"
                size="small"
              />

              <FormInput
                field="description"
                label="Description"
                placeholder="Describe condition, notable details, and what makes this collectible special"
                multiline
                rows={7}
                size="small"
                slotProps={{
                  htmlInput: {
                    sx: {
                      resize: "vertical",
                      overflow: "auto",
                      maxHeight: 250,
                    },
                  },
                }}
              />

              <TradeOptionsFormInput />
            </Stack>
          )}
        </Stack>

        <ActionButtons
          isSubmitting={isSubmitting}
          showPost={activeStep === STEPS_LABELS.length - 1}
        />
      </Stack>
    </Stack>
  );
}
