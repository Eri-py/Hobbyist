import { AxiosError } from "axios";
import { useState } from "react";

// Define accepted shapes for response.data
type ServerErrorResponse = {
  message?: string;
};
export type ServerError = AxiosError<ServerErrorResponse>;

// Custom hook for handling server errors
export function useServerError() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [continueDisabled, setContinueDisabled] = useState(false);

  const getErrorMessage = (error: ServerError) => {
    if (error.response && error.response.data) {
      const data = error.response.data;

      // shape returned from API controllers
      if (data.message && typeof data.message === "string") {
        return data.message;
      }
    }

    return "An unexpected error occurred.";
  };

  const handleServerError = (error: ServerError) => {
    const errorMessage = getErrorMessage(error);
    setServerError(errorMessage);
    setContinueDisabled(true);

    setTimeout(() => {
      setServerError(null);
    }, 10000);

    setTimeout(() => {
      setContinueDisabled(false);
    }, 3000);
  };

  const clearServerError = () => {
    setServerError(null);
  };

  return {
    serverError,
    continueDisabled,
    handleServerError,
    clearServerError,
  };
}
