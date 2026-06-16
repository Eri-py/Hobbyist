import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";

import Stack from "@mui/material/Stack";

import { UsernameAndPassword } from "@/components/auth/login/UsernameAndPasswordStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { useLogin } from "@hobbyist/hooks";
import { useNotifications } from "@/hooks/app/useNotifications";
import { axiosInstance } from "@/api/axiosInstance";
import { FormHeader } from "@/components/auth/FormHeader";
import { FormContainer } from "@/components/auth/FormContainer";
import { seo } from "@/lib/seo";

// Single key for the auth-failure notification: a new failure replaces the old rather than
// stacking, and advancing a step can retire it via dismissKey.
const AUTH_ERROR_KEY = "auth-error";

export const Route = createFileRoute("/_auth/login")({
  head: () =>
    seo({
      title: "Log in",
      description: "Log in to your Hobbyist account to post, message, and trade with other collectors.",
      path: "/login",
    }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { notify, dismissKey } = useNotifications();
  const {
    methods,
    step,
    otpData,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isCompleting,
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,
  } = useLogin(
    { replace: (path) => navigate({ to: path, replace: true }) },
    axiosInstance,
    undefined,
    (message) => notify({ severity: "error", message, key: AUTH_ERROR_KEY }),
  );

  // An auth error only keeps you on the current step; advancing means the failure is stale, so
  // retire it rather than let it linger into the next step.
  useEffect(() => {
    dismissKey(AUTH_ERROR_KEY);
  }, [step, dismissKey]);

  return (
    <FormContainer step={step}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
          <Stack sx={{
            gap: 2
          }}>
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
