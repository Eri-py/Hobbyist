import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";

import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import { UsernameAndPassword } from "@/components/auth/login/UsernameAndPasswordStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { useLogin } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { FormHeader } from "@/components/auth/FormHeader";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
});

function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    methods,
    step,
    setStep,
    otpData,
    serverErrorMessage,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isCompleting,
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,
  } = useLogin((path) => navigate({ to: path }), axiosInstance);

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
      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
          <Stack gap={2} paddingInline={2}>
            <FormHeader
              header={loginHeaderConfig[step].header}
              subtext={loginHeaderConfig[step].subtext}
              currentStep={String(step + 1)}
              totalSteps={String(LOGIN_TOTAL_STEPS)}
            />

            {step === 0 && <UsernameAndPassword handleNext={handleNext} isPending={isStarting} />}
            {step === 1 && otpData && (
              <OtpStep
                mode="login"
                email={otpData.email}
                intitialOtpExpiresAt={new Date(otpData.otpExpiresAt)}
                handleNext={handleNext}
                handleBack={() => setStep(0)}
                isPending={isCompleting}
              />
            )}
          </Stack>
        </form>
      </FormProvider>
    </Stack>
  );
}
