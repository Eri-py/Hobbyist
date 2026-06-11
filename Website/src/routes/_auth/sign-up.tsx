import { FormProvider } from "react-hook-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetails } from "@/components/auth/sign-up/PersonalDetailsStep";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameAndEmailStep";
import { InterestsStep } from "@/components/auth/sign-up/InterestsStep";
import { useSignUp } from "@hobbyist/hooks";
import { useNotifications } from "@/hooks/app/useNotifications";
import { axiosInstance } from "@/api/axiosInstance";
import { FormHeader } from "@/components/auth/FormHeader";
import { FormContainer } from "@/components/auth/FormContainer";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_auth/sign-up")({
  head: () =>
    seo({
      title: "Sign up",
      description: "Create a free Hobbyist account to share your collection and trade with the community.",
      path: "/sign-up",
    }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const { notify } = useNotifications();

  const {
    methods,
    step,
    otpExpiresAt,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isVerifying,
    isCompleting,
    popularInterests,
    signUpHeaderConfig,
    SIGNUP_TOTAL_STEPS,
  } = useSignUp(
    { replace: (path) => navigate({ to: path, replace: true }) },
    axiosInstance,
    undefined,
    (message) => notify({ severity: "error", message, key: "auth-error" }),
  );

  return (
    <FormContainer step={step}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
          <Stack sx={{
            gap: 2
          }}>
            <FormHeader
              header={signUpHeaderConfig[step].header}
              subtext={signUpHeaderConfig[step].subtext}
              activeStep={step}
              totalSteps={SIGNUP_TOTAL_STEPS}
            />

            {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
            {step === 1 && otpExpiresAt && (
              <OtpStep
                mode="signup"
                email={methods.getValues("email")}
                intitialOtpExpiresAt={otpExpiresAt}
                handleNext={handleNext}
                isPending={isVerifying}
              />
            )}
            {step === 2 && <PasswordStep handleNext={handleNext} />}
            {step === 3 && <PersonalDetails handleNext={handleNext} />}
            {step === 4 && (
              <InterestsStep popularInterests={popularInterests} isPending={isCompleting} />
            )}
          </Stack>
        </form>
      </FormProvider>
    </FormContainer>
  );
}
