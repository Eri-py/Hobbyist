import { AxiosError } from "axios";

type ServerErrorResponse = {
  message?: string;
};

export type ServerError = AxiosError<ServerErrorResponse>;

const GENERIC_MESSAGE = "An unexpected error occurred.";

/**
 * Turns any thrown error (typically an Axios error from a failed request) into a single
 * user-facing message. The one place "error → human string" lives, shared by web and mobile and by
 * both the notification system and any inline display.
 *
 * Resolution order: the API's own `message`, then a status-based fallback, then network/connection
 * failures (no response), then a generic default.
 */
export function getServerErrorMessage(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return GENERIC_MESSAGE;
  }

  // No response means the request never reached the server (offline, DNS, CORS, timeout).
  if (!error.response) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  const data = error.response.data as ServerErrorResponse | undefined;
  if (data && typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  const status = error.response.status;
  if (status === 401 || status === 403) return "You're not authorized to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our end. Please try again.";

  return GENERIC_MESSAGE;
}
