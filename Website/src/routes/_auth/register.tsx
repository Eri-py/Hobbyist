import { useForm, FormProvider } from "react-hook-form";
import { string, z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { AxiosResponse } from "axios";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import {
  type startRegistrationRequest,
  startRegistration,
  type verifyOtpRequest,
  verifyOtp,
  type completeRegistrationRequest,
  completeRegistration,
} from "@/api/AuthApi";
import { HorizontalLinearStepper } from "@/components/shared/HorizontalLinearStepper";
import { LogoWithName } from "@/components/shared/Logo";
import { useServerError, type ServerError } from "@/hooks/shared/useServerError";
import { OtpPage } from "@/components/auth/OtpPage";
import { Password } from "@/components/auth/register/Password";
import { PersonalDetails } from "@/components/auth/register/PersonalDetails";
import { UsernameAndEmail } from "@/components/auth/register/UsernameAndEmail";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  dateOfBirthSchema,
} from "@/components/auth/Schemas";
import { useTheme } from "@mui/material/styles";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";

export const Route = createFileRoute("/_auth/register")({
  component: Register,
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

function Register() {
  const [step, setStep] = useState<number>(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const { serverError, continueDisabled, handleServerError, clearServerError } = useServerError();
  const theme = useTheme();
  const isSmOrLarger = useBreakpoint();
  const navigate = useNavigate();

  const methods = useForm<registrationFormSchema>({
    mode: "onChange",
    resolver: zodResolver(RegistrationFormSchema),
  });

  const startRegistrationMutation = useMutation({
    mutationFn: (data: startRegistrationRequest) => startRegistration(data),
    onSuccess: (response: AxiosResponse<string>) => {
      setOtpExpiresAt(response.data);
      setStep(1);
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: verifyOtpRequest) => verifyOtp(data),
    onSuccess: () => setStep(2),
    onError: (error: ServerError) => handleServerError(error),
  });

  const completeRegistrationMutation = useMutation({
    mutationFn: (data: completeRegistrationRequest) => completeRegistration(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
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
          startRegistrationMutation.mutate({ username, email });
          break;
        }
        case 1: {
          const email = methods.getValues("email");
          const otp = methods.getValues("otp");
          verifyOtpMutation.mutate({ email, otp });
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

  const handleOtpExpiresAtUpdate = (newExpiresAt: string) => {
    setOtpExpiresAt(newExpiresAt);
  };

  const onSubmit = (formData: registrationFormSchema) => {
    clearServerError();
    completeRegistrationMutation.mutate(formData);
  };

  return (
    <Stack
      paddingBlock={2}
      paddingInline={1}
      gap={2}
      sx={{
        width: { xs: "100%", sm: "480px" },
        height: "fit-content",
        backgroundColor: theme.palette.background.default,
        boxShadow: { sm: "0 0 2px rgba(225, 225, 225, .5)" },
        borderRadius: { sm: "1rem" },
      }}
    >
      {!isSmOrLarger && <LogoWithName size="large" align="center" />}

      <HorizontalLinearStepper
        steps={registrationStepLabels}
        activeStep={step}
        setActiveStep={(value) => setStep(value)}
      />

      {serverError !== null && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverError}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {step === 0 && (
            <UsernameAndEmail
              handleNext={handleNext}
              isPending={startRegistrationMutation.isPending}
              isContinueDisabled={continueDisabled}
            />
          )}
          {step === 1 && otpExpiresAt && (
            <OtpPage
              email={methods.getValues("email")}
              otpExpiresAt={otpExpiresAt}
              handleNext={handleNext}
              handleBack={() => setStep(0)}
              isPending={verifyOtpMutation.isPending}
              isContinueDisabled={continueDisabled}
              onOtpExpiresAtUpdate={handleOtpExpiresAtUpdate}
              mode="register"
            />
          )}
          {step === 2 && <Password handleNext={handleNext} />}
          {step === 3 && (
            <PersonalDetails
              isPending={completeRegistrationMutation.isPending}
              isContinueDisabled={continueDisabled}
            />
          )}
        </form>
      </FormProvider>
    </Stack>
  );
}
