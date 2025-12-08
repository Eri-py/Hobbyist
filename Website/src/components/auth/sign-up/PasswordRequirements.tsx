import { useMemo } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

type PasswordRequirementsTypes = {
  password: string;
};

const passwordRequirements = [
  {
    test: (password: string) => password.length >= 8,
    message: "At least 8 characters long",
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    message: "At least one uppercase letter (A-Z)",
  },
  {
    test: (password: string) => /[a-z]/.test(password),
    message: "At least one lowercase letter (a-z)",
  },
  {
    test: (password: string) => /[0-9]/.test(password),
    message: "At least one number (0-9)",
  },
  {
    test: (password: string) => /[#?!@$%^&\-._]/.test(password),
    message: "At least one special character (#?!@$%^&-._)",
  },
];

export function PasswordRequirements({ password }: PasswordRequirementsTypes) {
  const theme = useTheme();
  const requirements = useMemo(
    () =>
      passwordRequirements.map((req) => {
        const met = req.test(password);

        return (
          <Stack direction="row" gap={0.25} alignItems="center" marginLeft={1}>
            {met ? (
              <CheckIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
            ) : (
              <CloseIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
            )}
            <Typography color="textSecondary" fontSize={15}>
              {req.message}
            </Typography>
          </Stack>
        );
      }),
    [password, theme]
  );

  return (
    <Stack gap={1}>
      <Typography color="textSecondary" fontSize={14}>
        Passwords must contain:
      </Typography>
      {requirements}
    </Stack>
  );
}
