import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import {
  type startLoginRequest,
  startLogin,
  type startLoginResponse,
  type completeLoginRequest,
  completeLogin,
} from "@/api/AuthApi";
import { LogoWithName } from "@/components/shared/Logo";
import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { UsernameAndPassword } from "@/components/auth/login/UsernameAndPassword";
import { OtpPage } from "@/components/auth/OtpStep";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useTheme } from "@mui/material/styles";

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
  const [step, setStep] = useState<number>(0);
  const [otpData, setOtpData] = useState<{
    email: string;
    otpExpiresAt: string;
  } | null>(null);

  const { serverError, continueDisabled, handleServerError, clearServerError } = useServerError();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDekstop = useBreakpoint();

  const methods = useForm<loginFormSchema>({
    mode: "onChange",
    resolver: zodResolver(LoginFormSchema),
  });

  const startLoginMutation = useMutation({
    mutationFn: (data: startLoginRequest) => startLogin(data),
    onSuccess: (response: AxiosResponse<startLoginResponse>) => {
      const data = response.data;
      setOtpData({
        email: data.email,
        otpExpiresAt: data.otpExpiresAt,
      });
      setStep(1);
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  const completeLoginMutation = useMutation({
    mutationFn: (data: completeLoginRequest) => completeLogin(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
  });

  const handleNext = async () => {
    const isValid = await methods.trigger(["identifier", "password"]);

    if (isValid) {
      clearServerError();
      const identifier = methods.getValues("identifier");
      const password = methods.getValues("password");
      startLoginMutation.mutate({ identifier, password });
    }
  };

  const handleOtpExpiresAtUpdate = (newExpiresAt: string) => {
    if (otpData) {
      setOtpData({
        ...otpData,
        otpExpiresAt: newExpiresAt,
      });
    }
  };

  const onSubmit = (formData: loginFormSchema) => {
    completeLoginMutation.mutate(formData);
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
        boxShadow: { md: "0 0 2px rgba(225, 225, 225, .5)" },
        borderRadius: { md: "1rem" },
      }}
    >
      {!isDekstop && <LogoWithName size="large" align="center" />}

      {serverError !== null && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverError}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {step === 0 && (
            <UsernameAndPassword
              handleNext={handleNext}
              isPending={startLoginMutation.isPending}
              isContinueDisabled={continueDisabled}
            />
          )}
          {step === 1 && otpData && (
            <OtpPage
              email={otpData.email}
              otpExpiresAt={otpData.otpExpiresAt}
              handleBack={() => setStep(0)}
              isPending={completeLoginMutation.isPending}
              isContinueDisabled={continueDisabled}
              onOtpExpiresAtUpdate={handleOtpExpiresAtUpdate}
              mode="login"
            />
          )}
        </form>
      </FormProvider>
    </Stack>
  );
}
