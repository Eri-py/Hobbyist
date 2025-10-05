import { AxiosError } from "axios";
import { useState } from "react";

// Define accepted shapes for response.data
type ServerErrorResponse = {
  message?: string;
};
export type ServerError = AxiosError<ServerErrorResponse>;

// Custom hook for handling server errors
export function useServerError() {
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);

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
    setServerErrorMessage(errorMessage);

    setTimeout(() => {
      setServerErrorMessage(null);
    }, 10000);
  };

  const clearServerError = () => {
    setServerErrorMessage(null);
  };

  return {
    serverErrorMessage,
    handleServerError,
    clearServerError,
  };
}
