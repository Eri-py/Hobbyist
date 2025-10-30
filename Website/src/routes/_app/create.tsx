import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import Stack from "@mui/material/Stack";

import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { DesktopCreateView } from "@/components/create/DesktopCreateView";
import { MobileCreateView } from "@/components/create/MobileCreateView";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Create",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);
  const { isDesktop } = useBreakpoint();
  const { files, getRootProps, getInputProps, isDragActive } = useMediaUpload();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Stack
      paddingBlock={{ xs: 0, md: 3 }}
      gap={3}
      flex={1}
      maxWidth={1000}
      width="100%"
      marginX={{ xs: 0, md: "auto" }}
    >
      {isDesktop ? (
        <DesktopCreateView files={files} getRootProps={getRootProps} isDragActive={isDragActive} />
      ) : (
        <MobileCreateView
          files={files}
          getRootProps={getRootProps}
          activeStep={activeStep}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      )}

      {/* Stores all uploaded content */}
      <input {...getInputProps()} />
    </Stack>
  );
}
