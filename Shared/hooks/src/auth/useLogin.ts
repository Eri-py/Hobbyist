import { type ReactNode, type KeyboardEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosInstance } from "axios";

import type { components } from "@hobbyist/types";
import { LoginFormSchema, type LoginFormSchemaTypes } from "@hobbyist/form-schemas";
import { getServerErrorMessage } from "../shared/getServerErrorMessage";
import { USER_DETAILS_QUERY_KEY } from "../app/useAuth";

// DTOs
type StartLoginRequest = components["schemas"]["StartLoginRequest"];
type StartLoginResponse = components["schemas"]["StartLoginResponse"];
type CompleteLoginRequest = components["schemas"]["CompleteLoginRequest"];
type AuthResult = components["schemas"]["AuthResult"];

type HeaderConfig = Record<
  number,
  {
    header: string;
    subtext: string | ReactNode;
  }
>;
export function useLogin(
  router: { replace: (path: string) => void },
  axiosInstance: AxiosInstance,
  onAuthSuccess?: (authResult: AuthResult) => Promise<void>,
  // Platform-supplied error sink: web routes it to the notification system, mobile to its own
  // inline display. The hook just hands over a normalized message.
  onError?: (message: string) => void,
) {
  // Constants
  const LOGIN_TOTAL_STEPS = 2;

  // Header configurations for each step
  const loginHeaderConfig: HeaderConfig = {
    0: {
      header: "Log in",
      subtext: "Glad to have you back!",
    },
    1: {
      header: "Verify email",
      subtext: "Enter the code sent to your email",
    },
  };

  const [step, setStep] = useState<number>(0);
  const [otpData, setOtpData] = useState<{
    email: string;
    otpExpiresAt: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // API functions
  const startLoginApi = (data: StartLoginRequest) => {
    return axiosInstance.post<StartLoginResponse>("login/start", data);
  };

  const completeLoginApi = (data: CompleteLoginRequest) => {
    return axiosInstance.post<AuthResult>("login/complete", data);
  };

  // Initialize form methods
  const methods = useForm<LoginFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      identifier: "",
      otp: "",
      password: "",
    },
  });

  const startLoginMutation = useMutation({
    mutationFn: (data: StartLoginRequest) => startLoginApi(data),
    onSuccess: (response) => {
      const data = response.data;
      setOtpData({
        email: data.email,
        otpExpiresAt: data.otpExpiresAt,
      });
      setStep(1);
    },
    onError: (error) => onError?.(getServerErrorMessage(error)),
  });

  const completeLoginMutation = useMutation({
    mutationFn: (data: CompleteLoginRequest) => completeLoginApi(data),
    onSuccess: async (response) => {
      const authResult = response.data;

      if (onAuthSuccess && authResult) {
        await onAuthSuccess(authResult);
      }
      await queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
      router.replace("/");
    },
    onError: (error) => onError?.(getServerErrorMessage(error)),
  });

  const handleNext = async () => {
    const isValid = await methods.trigger(["identifier", "password"]);

    if (isValid) {
      const identifier = methods.getValues("identifier");
      const password = methods.getValues("password");
      startLoginMutation.mutate({ identifier, password });
    }
  };

  // Handle enter key press
  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (step < 1) {
        handleNext();
      }
    }
  };

  // Handle form submission
  const onSubmit = (formData: LoginFormSchemaTypes) => {
    completeLoginMutation.mutate({
      identifier: formData.identifier,
      otp: formData.otp,
    });
  };

  return {
    // Form methods
    methods,

    // State
    step,
    otpData,

    // Header config
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,

    // Actions
    handleNext,
    onEnter,
    onSubmit,

    // Mutation states
    isStarting: startLoginMutation.isPending,
    isCompleting: completeLoginMutation.isPending,
  };
}
