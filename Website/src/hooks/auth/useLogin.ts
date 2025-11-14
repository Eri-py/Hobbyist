import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosResponse } from "axios";

import { useServerError, type ServerError } from "./useServerError";

import { axiosInstance } from "@/api/axiosInstance";
import { LoginFormSchema, type LoginFormSchemaTypes } from "@/schemas/LoginSchemas";

// DTOs
type startLoginRequest = {
  identifier: string;
  password: string;
};

type startLoginResponse = {
  otpExpiresAt: string;
  email: string;
};

type completeLoginRequest = {
  identifier: string;
  otp: string;
};

// API functions
const startLoginApi = (data: startLoginRequest) => {
  return axiosInstance.post("login/start", data);
};

const completeLoginApi = (data: completeLoginRequest) => {
  return axiosInstance.post("login/complete", data);
};

export function useLogin() {
  const [step, setStep] = useState<number>(0);
  const [otpData, setOtpData] = useState<{
    email: string;
    otpExpiresAt: string;
  } | null>(null);
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const navigate = useNavigate();

  // Initialize form methods
  const methods = useForm<LoginFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(LoginFormSchema),
  });

  const startLoginMutation = useMutation({
    mutationFn: (data: startLoginRequest) => startLoginApi(data),
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
    mutationFn: (data: completeLoginRequest) => completeLoginApi(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
  });

  // Handle next step with validation
  const handleNext = async () => {
    const isValid = await methods.trigger(["identifier", "password"]);

    if (isValid) {
      clearServerError();
      const identifier = methods.getValues("identifier");
      const password = methods.getValues("password");
      startLoginMutation.mutate({ identifier, password });
    }
  };

  // Handle enter key press
  const onEnter = (e: React.KeyboardEvent) => {
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

    // Server error handling
    serverErrorMessage,
    clearServerError,

    // Actions
    handleNext,
    onEnter,
    onSubmit,

    // Mutation states
    isStarting: startLoginMutation.isPending,
    isCompleting: completeLoginMutation.isPending,
  };
}
