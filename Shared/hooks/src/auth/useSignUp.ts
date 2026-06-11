import { type ReactNode, type KeyboardEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { SignUpFormSchema, type SignUpFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";
import { getServerErrorMessage } from "../shared/getServerErrorMessage";
import { USER_DETAILS_QUERY_KEY } from "../app/useAuth";

// DTOs
type StartSignUpRequest = components["schemas"]["StartSignUpRequest"];
type VerifyOtpRequest = components["schemas"]["VerifyOtpRequest"];
type VerifyOtpResponse = components["schemas"]["VerifyOtpResponse"];
type CompleteSignUpRequest = components["schemas"]["CompleteSignUpRequest"];
type StartSignUpResponse = components["schemas"]["OtpResponse"];
type AuthResult = components["schemas"]["AuthResult"];

// Define which fields belong to each step
const signUpSteps: Record<number, (keyof SignUpFormSchemaTypes)[]> = {
  0: ["username", "email"],
  1: ["otp"],
  2: ["password", "confirmPassword"],
  3: ["firstname", "lastname", "dateOfBirth"],
  4: ["interests"],
};

type HeaderConfig = Record<
  number,
  {
    header: string;
    subtext: string | ReactNode;
  }
>;
export function useSignUp(
  router: { replace: (path: string) => void },
  axiosInstance: AxiosInstance,
  onAuthSuccess?: (authResult: AuthResult) => Promise<void>,
  // Platform-supplied error sink: web routes it to the notification system, mobile to its own
  // inline display. The hook just hands over a normalized message.
  onError?: (message: string) => void,
) {
  // Constants
  const SIGNUP_TOTAL_STEPS = 5;

  // Header configurations for each step
  const signUpHeaderConfig: HeaderConfig = {
    0: {
      header: "Sign up",
      subtext: "Welcome to Hobbyist!",
    },
    1: {
      header: "Verify email",
      subtext: "Enter the code sent to your email",
    },
    2: {
      header: "Create password",
      subtext: "Choose a secure password",
    },
    3: {
      header: "Personal details",
      subtext: "Tell us a bit about yourself",
    },
    4: {
      header: "What do you collect?",
      subtext: "Pick your interests",
    },
  };

  const [step, setStep] = useState<number>(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [popularInterests, setPopularInterests] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // API functions
  const startSignUpApi = (data: StartSignUpRequest) => {
    return axiosInstance.post<StartSignUpResponse>("sign-up/start", data);
  };

  const verifyOtpApi = (data: VerifyOtpRequest) => {
    return axiosInstance.post<VerifyOtpResponse>("sign-up/verify-otp", data);
  };

  const completeSignUpApi = (data: CompleteSignUpRequest) => {
    return axiosInstance.post<AuthResult>("sign-up/complete", data);
  };

  // Initialize form methods
  const methods = useForm<SignUpFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      username: "",
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      interests: [],
    },
  });

  const startSignUpMutation = useMutation({
    mutationFn: (data: StartSignUpRequest) => startSignUpApi(data),
    onSuccess: (response) => {
      setOtpExpiresAt(new Date(response.data.otpExpiresAt));
      setStep(1);
    },
    onError: (error) => onError?.(getServerErrorMessage(error)),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtpApi(data),
    onSuccess: (response) => {
      setPopularInterests(response.data.popularInterests);
      setStep(2);
    },
    onError: (error) => onError?.(getServerErrorMessage(error)),
  });

  const completeSignUpMutation = useMutation({
    mutationFn: (data: CompleteSignUpRequest) => completeSignUpApi(data),
    onSuccess: async (response) => {
      const authResult = response.data;

      if (onAuthSuccess && authResult) {
        // Mobile: Pass tokens to be stored securely
        await onAuthSuccess(authResult);
      }
      await queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
      router.replace("/");
    },
    onError: (error) => onError?.(getServerErrorMessage(error)),
  });

  // Handle next step with validation
  const handleNext = async () => {
    const currentStep = signUpSteps[step];
    const isValid = await methods.trigger(currentStep);

    if (isValid) {
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
        case 3: {
          setStep(4);
          break;
        }
      }
    }
  };

  // Handle enter key press
  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (step < 4) {
        handleNext();
      }
    }
  };

  // Handle form submission
  const onSubmit = (formData: SignUpFormSchemaTypes) => {
    completeSignUpMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstname: formData.firstname,
      lastname: formData.lastname,
      dateOfBirth: formData.dateOfBirth,
      interests: formData.interests,
    });
  };

  return {
    // Form methods
    methods,

    // State
    step,
    otpExpiresAt,
    popularInterests,

    // Header config
    signUpHeaderConfig,
    SIGNUP_TOTAL_STEPS,

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
