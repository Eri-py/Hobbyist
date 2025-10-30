import { createFileRoute } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import { LogoWithName } from "@/components/shared/Logo";
import { UsernameAndPassword } from "@/components/auth/login/UsernameAndPasswordStep";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useTheme } from "@mui/material/styles";
import { OtpStep } from "@/components/auth/OtpStep";
import { useLogin } from "@/hooks/auth/useLogin";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
});

const LoginFormSchema = z.object({
  identifier: z.string("Invalid username or email").nonempty("Please enter username or email"),
  password: z.string("Invalid password").nonempty("Please enter password"),
  otp: z.string("Invalid otp").trim().length(6, "Invalid otp"),
});

type loginFormSchema = z.infer<typeof LoginFormSchema>;

function Login() {
  const theme = useTheme();
  const isDekstop = useBreakpoint();
  const {
    step,
    otpData,
    serverErrorMessage,
    clearServerError,
    startLogin,
    isStarting,
    completeLogin,
    isCompleting,
  } = useLogin();

  const methods = useForm<loginFormSchema>({
    mode: "onChange",
    resolver: zodResolver(LoginFormSchema),
  });

  const handleNext = async () => {
    const isValid = await methods.trigger(["identifier", "password"]);

    if (isValid) {
      clearServerError();
      const identifier = methods.getValues("identifier");
      const password = methods.getValues("password");
      startLogin({ identifier, password });
    }
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission

      // Only trigger next step if we're not on the final step
      if (step < 2) {
        handleNext();
      }
    }
  };

  const onSubmit = (formData: loginFormSchema) => {
    completeLogin(formData);
  };

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
