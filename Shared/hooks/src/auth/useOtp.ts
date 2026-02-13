import { useState, useEffect } from "react";
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

  // API function
  const resendOtpApi = (data: ResendOtpRequest, endpoint: string) => {
    return axiosInstance.post<ResendOtpResponse>(endpoint, data);
  };

  // Enable resend button after 1/5th of the initial OTP duration
  useEffect(() => {
    const enableResendTimer = setTimeout(
      () => {
        setIsResendDisabled(false);
      },
      (initialOtpExpiresAt.getTime() - Date.now()) / 5,
    );

    return () => clearTimeout(enableResendTimer);
  }, [initialOtpExpiresAt]);

  const resendOtpMutation = useMutation({
    mutationFn: ({ data, mode }: { data: ResendOtpRequest; mode: "login" | "signup" }) => {
      const endpoint = mode === "signup" ? "sign-up/resend-otp" : "login/resend-otp";
      return resendOtpApi(data, endpoint);
    },
    onSuccess: (response) => {
      const newOtpExpiresAt = new Date(response.data.otpExpiresAt);
      const newEndTime = newOtpExpiresAt.getTime();

      setEndTime(newEndTime);
      setIsResendDisabled(true);

      // Re-enable resend button after 1/5th of the new OTP duration with cleanup
      const enableResendTimer = setTimeout(
        () => {
          setIsResendDisabled(false);
        },
        (newEndTime - Date.now()) / 5,
      );

      return () => clearTimeout(enableResendTimer);
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
