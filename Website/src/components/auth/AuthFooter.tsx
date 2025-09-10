import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

type AuthFooterProps = {
  mode: "login" | "register";
};

export function AuthFooter({ mode }: AuthFooterProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const footerContent = {
    login: {
      question: "Don't have an account?",
      linkText: "sign up here",
      target: "/register",
    },
    register: {
      question: "Already have an account?",
      linkText: "login here",
      target: "/login",
    },
  };

  const currentContent = footerContent[mode];

  return (
    <Stack gap="0.25rem">
      <Typography
        alignSelf="center"
        sx={{
          color: theme.palette.text.primary,
          fontSize: "0.875rem",
        }}
      >
        {currentContent.question}{" "}
        <Link
          component="button"
          type="button"
          onClick={() => navigate({ to: currentContent.target })}
        >
          {currentContent.linkText}
        </Link>
      </Typography>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          fontSize: "0.75rem",
          lineHeight: 1.4,
        }}
      >
        This site is protected by reCAPTCHA and the Google <Link>Privacy Policy</Link> and{" "}
        <Link>Terms of Service</Link> apply
      </Typography>
    </Stack>
  );
}
