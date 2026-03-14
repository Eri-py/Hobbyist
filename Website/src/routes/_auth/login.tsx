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
import { FormContainer } from "@/components/auth/FormContainer";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
});

function Login() {
  const theme = useTheme();
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
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,
  } = useLogin((path) => navigate({ to: path }), axiosInstance);

  return (
    <FormContainer step={step}>
      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
          <Stack gap={2}>
            <FormHeader
              header={loginHeaderConfig[step].header}
              subtext={loginHeaderConfig[step].subtext}
              activeStep={step}
              totalSteps={LOGIN_TOTAL_STEPS}
            />

            {step === 0 && <UsernameAndPassword handleNext={handleNext} isPending={isStarting} />}
            {step === 1 && otpData && (
              <OtpStep
                mode="login"
                email={otpData.email}
                intitialOtpExpiresAt={new Date(otpData.otpExpiresAt)}
                handleNext={handleNext}
                isPending={isCompleting}
              />
            )}
          </Stack>
        </form>
      </FormProvider>
    </FormContainer>
  );
}
