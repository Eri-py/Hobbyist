import { createFileRoute } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { useState, useMemo, type SyntheticEvent } from "react";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useMediaUpload } from "@/hooks/create/useMediaUpload";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { ErrorStack } from "@/components/shared/ErrorStack";
import { useCreate } from "@/hooks/create/useCreate";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { TextTab } from "@/components/create/tabs/TextTab";
import { MediaTab } from "@/components/create/tabs/MediaTab";
import { LinkTab } from "@/components/create/tabs/LinkTab";
import { CommunitySelector } from "@/components/create/CommunitySelector";

type TabType = "text" | "images" | "link";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { isDesktop } = useDeviceType();
  const {
    files,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    reorderFiles,
    errors,
    removeError,
  } = useMediaUpload();
  const theme = useTheme();
  const isDesktopView = useMediaQuery(theme.breakpoints.up("md"));
  const [activeTab, setActiveTab] = useState<TabType>("images");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("Select a community");

  const { methods, serverErrorMessage, handleSubmit, isSubmitting } = useCreate();

  const handleTabChange = (_: SyntheticEvent, newValue: TabType) => {
    setActiveTab(newValue);
  };

  const draftsButton = useMemo(
    () => (
      <IconButton size="small" onClick={() => {}}>
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: theme.palette.primary.main,
            cursor: "pointer",
          }}
        >
          Drafts
        </Typography>
      </IconButton>
    ),
    [theme],
  );

  // Configure mobile header with drafts button
  useMobileHeaderConfig({
    right: draftsButton,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(() => handleSubmit(files))}
        style={{ display: "flex", flex: 1 }}
      >
        <Stack gap={3} flex={1}>
          {serverErrorMessage && (
            <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
              {serverErrorMessage}
            </Alert>
          )}

          <Stack
            flex={1}
            gap={0}
            maxWidth={850}
            width="100%"
            marginX="auto"
            px={isDesktopView ? 3 : 2}
          >
            {/* Community Selector */}
            <Box
              sx={{
                pt: isDesktopView ? 2.5 : 1.5,
                pb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CommunitySelector
                selectedCommunity={selectedCommunity}
                onCommunityChange={setSelectedCommunity}
              />
              {isDesktopView && draftsButton}
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                minHeight: 42,
                "& .MuiTabs-indicator": {
                  backgroundColor: theme.palette.primary.main,
                },
                "& .MuiTab-root": {
                  minHeight: 42,
                  textTransform: "none",
                  fontWeight: 500,
                },
              }}
            >
              <Tab label="Text" value="text" />
              <Tab label="Media" value="images" />
              <Tab label="Link" value="link" />
            </Tabs>

            {/* Content Area */}
            <Box sx={{ py: 2 }}>
              {activeTab === "text" && <TextTab />}
              {activeTab === "images" && (
                <MediaTab
                  files={files}
                  getRootProps={getRootProps}
                  isDragActive={isDragActive}
                  removeFile={removeFile}
                  reorderFiles={reorderFiles}
                />
              )}
              {activeTab === "link" && <LinkTab />}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ pb: 2, pt: 1 }}>
              <Stack direction="row" gap={1} width="100%">
                <Button
                  variant="outlined"
                  size={isDesktopView ? "medium" : "large"}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  type="button"
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  size={isDesktopView ? "medium" : "large"}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </Stack>
            </Box>
          </Stack>

          {/* Error notifications */}
          <ErrorStack
            errors={errors}
            onRemoveError={removeError}
            position={isDesktop ? "top-right" : "bottom-center"}
          />

          {/* Stores all uploaded content */}
          <input {...getInputProps()} />
        </Stack>
      </form>
    </FormProvider>
  );
}
