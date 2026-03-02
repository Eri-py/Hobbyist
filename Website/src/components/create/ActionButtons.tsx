import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ActionButtonsProps = {
  isSubmitting: boolean;
};

export function ActionButtons({ isSubmitting }: ActionButtonsProps) {
  const { isDesktop } = useDeviceType();

  if (isDesktop) {
    return (
      <Stack direction="row" gap={1} width="50%" alignSelf="flex-end">
        <Button variant="outlined" fullWidth size="medium" type="button">
          Save Draft
        </Button>
        <Button
          variant="contained"
          size="medium"
          type="submit"
          disabled={isSubmitting}
          sx={{ minWidth: 200 }}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" gap={2} width="100%" alignSelf="flex-end" justifyContent="flex-end">
      <Button
        variant="text"
        type="button"
        startIcon={<DownloadRoundedIcon />}
        sx={{
          "& .MuiButton-startIcon .MuiSvgIcon-root": {
            color: "primary.main",
          },
        }}
      >
        Save Draft
      </Button>
      <Button
        variant="text"
        type="submit"
        disabled={isSubmitting}
        startIcon={<SendRoundedIcon />}
        sx={{
          border: "none",
          "& .MuiButton-startIcon .MuiSvgIcon-root": {
            color: "primary.main",
          },
        }}
      >
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </Stack>
  );
}
