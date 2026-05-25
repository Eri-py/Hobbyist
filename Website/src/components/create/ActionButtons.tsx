import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

type ActionButtonsProps = {
  showPost?: boolean;
};

export function ActionButtons({ showPost = true }: ActionButtonsProps) {
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
          size="large"
          startIcon={<SendRoundedIcon />}
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
