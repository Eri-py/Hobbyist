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
  return (
    <Stack direction="row" gap={isDesktop ? 3 : 2} alignSelf="flex-end" justifyContent="flex-end">
      <Button
        variant="text"
        type="button"
        size="large"
        startIcon={<DownloadRoundedIcon />}
        sx={{
          fontSize: { md: 17 },
          "& .MuiButton-startIcon .MuiSvgIcon-root": {
            fontSize: { md: 17 },
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
        size="large"
        startIcon={<SendRoundedIcon />}
        sx={{
          fontSize: { md: 17 },
          border: "none",
          "& .MuiButton-startIcon .MuiSvgIcon-root": {
            fontSize: { md: 17 },
            color: "primary.main",
          },
        }}
      >
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </Stack>
  );
}
