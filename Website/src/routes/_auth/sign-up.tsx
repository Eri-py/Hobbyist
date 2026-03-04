import { FormProvider } from "react-hook-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetails } from "@/components/auth/sign-up/PersonalDetailsStep";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameAndEmailStep";
import { useSignUp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { FormHeader } from "@/components/auth/FormHeader";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUp,
});

function SignUp() {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    methods,
    step,
    setStep,
    otpExpiresAt,
    serverErrorMessage,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isVerifying,
    isCompleting,
    signUpHeaderConfig,
    SIGNUP_TOTAL_STEPS,
  } = useSignUp((path) => navigate({ to: path }), axiosInstance);

  return (
    <Stack
      paddingBlock={2}
      paddingInline={1}
      gap={2}
      sx={{
        width: { xs: "100%", md: "480px" },
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
                handleBack={() => setStep(0)}
                isPending={isVerifying}
              />
            )}
            {step === 2 && <PasswordStep handleNext={handleNext} />}
            {step === 3 && <PersonalDetails isPending={isCompleting} />}
          </Stack>
        </form>
      </FormProvider>
    </Stack>
  );
}
