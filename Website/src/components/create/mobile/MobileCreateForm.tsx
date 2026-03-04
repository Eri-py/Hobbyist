import type { DropzoneRootProps } from "react-dropzone";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";

import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CreateTips, type CreateTipKey } from "@/components/create/CreateTips";
import { ActionButtons } from "@/components/create/ActionButtons";
import { MobileHeader } from "@/components/create/mobile/MobileHeader";
import {
  DescriptionFormInput,
  TitleFormInput,
  TradeOptionsFormInput,
} from "@/components/create/FormInputs";
import { MediaCarousel } from "@/components/create/MediaCarousel";
import { UploadArea } from "@/components/create/UploadArea";
import { useMediaCarousel } from "@/hooks/create/useMediaCarousel";

const STEPS = [
  { label: "Images & Videos", tipKey: "media" as CreateTipKey },
  { label: "Details", tipKey: "details" as CreateTipKey },
];

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
  const currentStepConfig = STEPS[activeStep];

  return (
    <Stack
      width="100%"
      maxWidth={1500}
      direction="column"
      marginX="auto"
      paddingBottom={18}
      alignItems="flex-start"
    >
      <Stack gap={3} width="100%" minWidth={0}>
        <MobileHeader
          totalSteps={STEPS.length}
          activeStep={activeStep}
          stepLabel={currentStepConfig.label}
          onNext={onNext}
          onBack={onBack}
        />
        <Stack gap={3}>
          {activeStep === 0 && (
            <Stack gap={1}>
              <Typography variant="subtitle2">Images and videos</Typography>

              <Box sx={{ width: "100%", aspectRatio: "8 / 7", minHeight: 250, display: "flex" }}>
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
            <Stack gap={3}>
              <TitleFormInput />

              <DescriptionFormInput rows={7} />

              <TradeOptionsFormInput />
            </Stack>
          )}
        </Stack>

        <ActionButtons isSubmitting={isSubmitting} showPost={activeStep === STEPS.length - 1} />

        <Paper
          component="footer"
          sx={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 60,
            zIndex: 10,
            p: 2,
            borderRadius: 2,
          }}
        >
          <CreateTips activeTip={currentStepConfig.tipKey} />
        </Paper>
      </Stack>
    </Stack>
  );
}
