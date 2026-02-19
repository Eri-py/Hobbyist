import { useState, type SyntheticEvent } from "react";
import type { DropzoneRootProps } from "react-dropzone";
import { useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";

import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { MobileImageDisplay } from "./MobileImageDisplay";
import { UploadArea } from "../UploadArea";

type TabType = "text" | "images" | "link";

type MobileCreateFormProps = {
  files: FileWithMetadata[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  removeFile: (fileId: string) => void;
};

export function MobileCreateForm({ files, getRootProps, removeFile }: MobileCreateFormProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("Select a community");
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  const handleTabChange = (_: SyntheticEvent, newValue: TabType) => {
    setActiveTab(newValue);
  };

  return (
    <Stack flex={1} gap={0}>
      {/* Header */}
      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create post
        </Typography>
        <Typography
          component="button"
          onClick={() => {}}
          sx={{
            fontSize: "1rem",
            color: theme.palette.primary.main,
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
          }}
        >
          Drafts
        </Typography>
      </Stack>

      {/* Community Selector */}
      <Paper
        elevation={0}
        sx={{
          mx: 2,
          my: 1.5,
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "20px",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          variant="standard"
          disableUnderline
          sx={{
            flex: 1,
            "& .MuiSelect-select": {
              padding: 0,
            },
          }}
        >
          <MenuItem value="Select a community">Select a community</MenuItem>
          <MenuItem value="Community 1">Community 1</MenuItem>
          <MenuItem value="Community 2">Community 2</MenuItem>
        </Select>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          mx: 2,
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <Tab label="Text" value="text" />
        <Tab label="Images & Video" value="images" />
        <Tab label="Link" value="link" />
      </Tabs>

      {/* Content Area */}
      <Box sx={{ flex: 1, px: 2, py: 2 }}>
        {activeTab === "text" && (
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

        {activeTab === "images" && (
          <Stack gap={2}>
            <Stack gap={2} flex={1}>
              {files.length > 0 ? (
                <MobileImageDisplay
                  files={files}
                  getRootProps={getRootProps}
                  removeFile={removeFile}
                />
              ) : (
                <UploadArea getRootProps={getRootProps} variant="mobile" />
              )}
            </Stack>

            <Paper elevation={0} sx={{ padding: 2 }}>
              <Typography variant="body2" fontSize={13} color="text.secondary" textAlign="center">
                Tip: Add multiple photos to show different angles
              </Typography>
            </Paper>
          </Stack>
        )}

        {activeTab === "link" && <Box>{/* Link tab content */}</Box>}
      </Box>
    </Stack>
  );
}
