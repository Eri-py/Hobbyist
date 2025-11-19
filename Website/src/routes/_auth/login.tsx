import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";

import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import { LogoWithName } from "@/components/shared/Logo";
import { UsernameAndPassword } from "@/components/auth/login/UsernameAndPasswordStep";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { OtpStep } from "@/components/auth/OtpStep";
import { useLogin } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
});

function Login() {
  const theme = useTheme();
  const isDekstop = useBreakpoint();
  const navigate = useNavigate();
  const {
    methods,
    step,
    otpData,
    serverErrorMessage,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isCompleting,
  } = useLogin((path) => {
    navigate({ to: path });
  }, axiosInstance);

  return (
    <Stack
      paddingBlock={2}
      paddingInline={1}
      gap={2}
      sx={{
        maxWidth: { xs: "100%", md: "480px" },
        height: "fit-content",
        backgroundColor: theme.palette.background.default,
      }}
    >
      {!isDekstop && <LogoWithName size="large" align="center" />}

      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
          {step === 0 && <UsernameAndPassword handleNext={handleNext} isPending={isStarting} />}
          {step === 1 && otpData && (
            <OtpStep
              mode="login"
              email={otpData.email}
              intitialOtpExpiresAt={new Date(otpData.otpExpiresAt)}
              handleNext={handleNext}
              handleBack={() => {}}
              isPending={isCompleting}
            />
          )}
        </form>
      </FormProvider>
    </Stack>
  );
}
