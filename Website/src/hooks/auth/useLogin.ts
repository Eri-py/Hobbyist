import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useState } from "react";

import { useServerError, type ServerError } from "./useServerError";
import { useNavigate } from "@tanstack/react-router";
import { axiosInstance } from "@/api/axiosInstance";

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

  return {
    step,
    otpData,

    serverErrorMessage,
    clearServerError,

    startLogin: startLoginMutation.mutate,
    isStarting: startLoginMutation.isPending,

    completeLogin: completeLoginMutation.mutate,
    isCompleting: completeLoginMutation.isPending,
  };
}
