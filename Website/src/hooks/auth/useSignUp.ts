import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";

// Types for API requests
type StartSignUpRequest = {
  username: string;
  email: string;
};

type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResendOtpRequest = {
  username: string;
  email: string;
};

type CompleteSignUpRequest = {
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
};

type StartSignUpResponse = {
  otpExpiresAt: string;
};

export type ResendOtpResponse = {
  otpExpiresAt: string;
};

// API functions
const startSignUpApi = (data: StartSignUpRequest) => {
  return axiosInstance.post<StartSignUpResponse>("sign-up/start", data);
};

const verifyOtpApi = (data: VerifyOtpRequest) => {
  return axiosInstance.post("sign-up/verify-otp", data);
};

const resendOtpApi = (data: ResendOtpRequest) => {
  return axiosInstance.post<ResendOtpResponse>("sign-up/resend-otp", data);
};

const completeSignUpApi = (data: CompleteSignUpRequest) => {
  return axiosInstance.post("sign-up/complete", data);
};

export function useSignUp() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [step, setStep] = useState<number>(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const navigate = useNavigate();

  const startSignUpMutation = useMutation({
    mutationFn: (data: StartSignUpRequest) => startSignUpApi(data),
    onSuccess: (response) => {
      setOtpExpiresAt(new Date(response.data.otpExpiresAt));
      setStep(1);
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtpApi(data),
    onSuccess: () => setStep(2),
    onError: (error: ServerError) => handleServerError(error),
  });

  const resendOtpMutation = useMutation({
    mutationFn: (data: ResendOtpRequest) => resendOtpApi(data),
    onSuccess: (response) => setOtpExpiresAt(new Date(response.data.otpExpiresAt)),
    onError: (error: ServerError) => handleServerError(error),
  });

  const completeSignUpMutation = useMutation({
    mutationFn: (data: CompleteSignUpRequest) => completeSignUpApi(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
  });

  return {
    // State
    step,
    setStep,
    otpExpiresAt,

    // Server error handling
    serverErrorMessage,
    clearServerError,

    // Mutations
    startSignUp: startSignUpMutation.mutate,
    isStarting: startSignUpMutation.isPending,

    verifyOtp: verifyOtpMutation.mutate,
    isVerifying: verifyOtpMutation.isPending,

    resendOtpAsync: resendOtpMutation.mutateAsync,
    isResendingOtp: resendOtpMutation.isPending,

    completeSignUp: completeSignUpMutation.mutate,
    isCompleting: completeSignUpMutation.isPending,
  };
}
