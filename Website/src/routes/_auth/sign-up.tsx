import { FormProvider } from "react-hook-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { HorizontalLinearStepper } from "@/components/shared/HorizontalLinearStepper";
import { LogoWithName } from "@/components/shared/Logo";
import { OtpStep } from "@/components/auth/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetails } from "@/components/auth/sign-up/PersonalDetailsStep";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameAndEmailStep";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useSignUp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUp,
});

function SignUp() {
  const theme = useTheme();
  const isDekstop = useBreakpoint();
  const navigate = useNavigate();
  const {
    methods,
    step,
    setStep,
    otpExpiresAt,
    signUpStepLabels,
    serverErrorMessage,
    handleNext,
    onEnter,
    onSubmit,
    isStarting,
    isVerifying,
    isCompleting,
  } = useSignUp((path) => {
    navigate({ to: path });
  }, axiosInstance);

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
      {!isDekstop && <LogoWithName size="large" align="center" />}

      <HorizontalLinearStepper
        steps={signUpStepLabels}
        activeStep={step}
        setActiveStep={(value) => setStep(value)}
      />

      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: 16 }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={onEnter}>
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
        </form>
      </FormProvider>
    </Stack>
  );
}
