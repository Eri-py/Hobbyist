import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import type { components } from "@hobbyist/types";
import { type ServerError, useServerError } from "../shared/useServerError";

// DTOs
type ResendOtpRequest = components["schemas"]["ResendOtpRequest"];
type ResendOtpResponse = components["schemas"]["OtpResponse"];

export function useOtp(initialOtpExpiresAt: Date, axiosInstance: AxiosInstance) {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [endTime, setEndTime] = useState<number>(initialOtpExpiresAt.getTime());
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
  const resendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API function
  const resendOtpApi = (data: ResendOtpRequest, endpoint: string) => {
    return axiosInstance.post<ResendOtpResponse>(endpoint, data);
  };

  // Keep a single active resend timer and always clear stale timers.
  useEffect(() => {
    if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
    }

    resendTimerRef.current = setTimeout(
      () => {
        setIsResendDisabled(false);
        resendTimerRef.current = null;
      },
      Math.max(0, (endTime - Date.now()) / 5),
    );

    return () => {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [endTime]);

  const resendOtpMutation = useMutation({
    mutationFn: ({ data, mode }: { data: ResendOtpRequest; mode: "login" | "signup" }) => {
      const endpoint = mode === "signup" ? "sign-up/resend-otp" : "login/resend-otp";
      return resendOtpApi(data, endpoint);
    },
    onSuccess: (response) => {
      const newOtpExpiresAt = new Date(response.data.otpExpiresAt);
      const newEndTime = newOtpExpiresAt.getTime();

      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }

      setEndTime(newEndTime);
      setIsResendDisabled(true);
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  const handleResend = (data: ResendOtpRequest, mode: "login" | "signup") => {
    resendOtpMutation.mutate({ data, mode });
  };

  return {
    // State
    endTime,
    isResendDisabled,

    // Server error handling
    serverErrorMessage,
    clearServerError,

    // Actions
    handleResend,

    // Mutation states
    isResending: resendOtpMutation.isPending,
  };
}
