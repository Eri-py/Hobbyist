import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

type ActionButtonsProps = {
  isSubmitting: boolean;
  showPost?: boolean;
};

export function ActionButtons({ isSubmitting, showPost = true }: ActionButtonsProps) {
  return (
    <Stack
      direction="row"
      sx={{
        gap: 2,
        alignSelf: "flex-end",
        justifyContent: "flex-end",
      }}
    >
      {showPost && (
        <Button
          variant="text"
          type="submit"
          disabled={isSubmitting}
          size="large"
          startIcon={
            isSubmitting ? <CircularProgress size={16} thickness={5} /> : <SendRoundedIcon />
          }
          sx={{
            fontSize: { md: 17 },
            "& .MuiButton-startIcon .MuiSvgIcon-root": {
              fontSize: { md: 17 },
              color: "primary.main",
            },
          }}
        >
          Post
        </Button>
      )}
    </Stack>
  );
}
