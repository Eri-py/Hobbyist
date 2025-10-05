import { useForm, FormProvider } from "react-hook-form";
import { string, z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { HorizontalLinearStepper } from "@/components/shared/HorizontalLinearStepper";
import { LogoWithName } from "@/components/shared/Logo";
import { OtpStep } from "@/components/auth/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetails } from "@/components/auth/sign-up/PersonalDetails";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameAndEmailStep";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  dateOfBirthSchema,
} from "@/components/auth/Schemas";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useSignUp } from "@/hooks/auth/useSignUp";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUp,
});

const RegistrationFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  otp: z.string("Invalid otp").trim().length(6, "Invalid otp"),
  password: passwordSchema,
  confirmPassword: string("Invalid password").nonempty("Please enter password again"),
  firstname: nameSchema("Firstname"),
  lastname: nameSchema("Lastname"),
  dateOfBirth: dateOfBirthSchema,
});

type registrationFormSchema = z.infer<typeof RegistrationFormSchema>;

const registrationSteps: Record<number, (keyof registrationFormSchema)[]> = {
  0: ["username", "email"],
  1: ["otp"],
  2: ["password", "confirmPassword"],
  3: ["firstname", "lastname", "dateOfBirth"],
};

const registrationStepLabels: string[] = [
  "Username and Email",
  "Verification Code",
  "Password",
  "Personal Details",
];

function SignUp() {
  const theme = useTheme();
  const isDekstop = useBreakpoint();

  const {
    step,
    setStep,
    otpExpiresAt,
    serverErrorMessage,
    clearServerError,
    startSignUp,
    isStarting,
    verifyOtp,
    isVerifying,
    resendOtpAsync,
    isResendingOtp,
    completeSignUp,
    isCompleting,
  } = useSignUp();

  const methods = useForm<registrationFormSchema>({
    mode: "onChange",
    resolver: zodResolver(RegistrationFormSchema),
  });

  const handleNext = async () => {
    const currentStep = registrationSteps[step];
    const isValid = await methods.trigger(currentStep);

    if (isValid) {
      clearServerError();
      switch (step) {
        case 0: {
          const username = methods.getValues("username");
          const email = methods.getValues("email");
          startSignUp({ username, email });
          break;
        }
        case 1: {
          const email = methods.getValues("email");
          const otp = methods.getValues("otp");
          verifyOtp({ email, otp });
          break;
        }
        case 2: {
          const password = methods.getValues("password");
          const confirmPassword = methods.getValues("confirmPassword");
          if (password !== confirmPassword) {
            methods.setError("confirmPassword", { message: "Passwords do not match" });
            break;
          }
          setStep(3);
          break;
        }
      }
    }
  };

  const onSubmit = (formData: registrationFormSchema) => {
    clearServerError();
    completeSignUp({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstname: formData.firstname,
      lastname: formData.lastname,
      dateOfBirth: formData.dateOfBirth,
    });
  };

  return (
    <Stack
      paddingBlock={2}
      paddingInline={1}
      gap={2}
      sx={{
        width: { xs: "100%", md: "480px" },
        height: "fit-content",
        backgroundColor: theme.palette.background.default,
        boxShadow: { md: "0 0 2px rgba(225, 225, 225, .5)" },
        borderRadius: { md: "1rem" },
      }}
    >
      {!isDekstop && <LogoWithName size="large" align="center" />}

      <HorizontalLinearStepper
        steps={registrationStepLabels}
        activeStep={step}
        setActiveStep={(value) => setStep(value)}
      />

      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
          {step === 1 && otpExpiresAt && (
            <OtpStep
              mode="signup"
              email={methods.getValues("email")}
              username={methods.getValues("username")}
              intitialOtpExpiresAt={otpExpiresAt}
              handleNext={handleNext}
              handleBack={() => setStep(0)}
              isPending={isVerifying}
              resendOtpAsync={resendOtpAsync}
              isResending={isResendingOtp}
            />
          )}
          {step === 2 && <PasswordStep handleNext={handleNext} />}
          {step === 3 && <PersonalDetails isPending={isCompleting} />}
        </form>
      </FormProvider>
    </Stack>
  );
}
