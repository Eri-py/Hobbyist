import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";
import { SignUpFormSchema, type SignUpFormSchemaTypes } from "@/schemas/SignUpSchemas";
import type { components } from "@hobbyist/api-client";

// Dtos
type StartSignUpRequest = components["schemas"]["StartSignUpRequest"];
type VerifyOtpRequest = components["schemas"]["VerifyOtpRequest"];
type CompleteSignUpRequest = components["schemas"]["CompleteSignUpRequest"];
type StartSignUpResponse = components["schemas"]["OtpResponse"];
type AuthResult = components["schemas"]["AuthResult"];

// API functions
const startSignUpApi = (data: StartSignUpRequest) => {
  return axiosInstance.post<StartSignUpResponse>("sign-up/start", data);
};

const verifyOtpApi = (data: VerifyOtpRequest) => {
  return axiosInstance.post("sign-up/verify-otp", data);
};

const completeSignUpApi = (data: CompleteSignUpRequest) => {
  return axiosInstance.post<AuthResult>("sign-up/complete", data);
};

// Define which fields belong to each step
const signUpSteps: Record<number, (keyof SignUpFormSchemaTypes)[]> = {
  0: ["username", "email"],
  1: ["otp"],
  2: ["password", "confirmPassword"],
  3: ["firstname", "lastname", "dateOfBirth"],
};

const signUpStepLabels: string[] = [
  "Username and Email",
  "Verification Code",
  "Password",
  "Personal Details",
];

export function useSignUp() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const [step, setStep] = useState<number>(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Initialize form methods
  const methods = useForm<SignUpFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(SignUpFormSchema),
  });

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

  const completeSignUpMutation = useMutation({
    mutationFn: (data: CompleteSignUpRequest) => completeSignUpApi(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
  });

  // Handle next step with validation
  const handleNext = async () => {
    const currentStep = signUpSteps[step];
    const isValid = await methods.trigger(currentStep);

    if (isValid) {
      clearServerError();
      switch (step) {
        case 0: {
          const username = methods.getValues("username");
          const email = methods.getValues("email");
          startSignUpMutation.mutate({ username, email });
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

  // Handle enter key press
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (step < 3) {
        handleNext();
      }
    }
  };

  // Handle form submission
  const onSubmit = (formData: SignUpFormSchemaTypes) => {
    clearServerError();
    completeSignUpMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstname: formData.firstname,
      lastname: formData.lastname,
      dateOfBirth: formData.dateOfBirth,
    });
  };

  return {
    // Form methods
    methods,

    // State
    step,
    setStep,
    otpExpiresAt,
    signUpStepLabels,

    // Server error handling
    serverErrorMessage,
    clearServerError,

    // Actions
    handleNext,
    onEnter,
    onSubmit,

    // Mutation states
    isStarting: startSignUpMutation.isPending,
    isVerifying: verifyOtpMutation.isPending,
    isCompleting: completeSignUpMutation.isPending,
  };
}
