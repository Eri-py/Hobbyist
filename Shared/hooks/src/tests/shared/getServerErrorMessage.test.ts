import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

import { getServerErrorMessage } from "../../shared/getServerErrorMessage";

const makeAxiosError = (status?: number, message?: string): AxiosError => {
  const response =
    status === undefined
      ? undefined
      : {
          data: message === undefined ? {} : { message },
          status,
          statusText: "",
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
        };

  return new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response as any,
  );
};

describe("getServerErrorMessage", () => {
  it("uses the API's message when present", () => {
    expect(getServerErrorMessage(makeAxiosError(400, "Email already taken"))).toBe(
      "Email already taken",
    );
  });

  it("ignores a blank message and falls back", () => {
    expect(getServerErrorMessage(makeAxiosError(400, "   "))).toBe("An unexpected error occurred.");
  });

  it("reports a connection problem when there is no response", () => {
    expect(getServerErrorMessage(makeAxiosError())).toMatch(/couldn't reach the server/i);
  });

  it("maps 401/403 to an authorization message", () => {
    expect(getServerErrorMessage(makeAxiosError(401))).toMatch(/not authorized/i);
    expect(getServerErrorMessage(makeAxiosError(403))).toMatch(/not authorized/i);
  });

  it("maps 404 to a not-found message", () => {
    expect(getServerErrorMessage(makeAxiosError(404))).toMatch(/couldn't find/i);
  });

  it("maps 429 to a rate-limit message", () => {
    expect(getServerErrorMessage(makeAxiosError(429))).toMatch(/too many attempts/i);
  });

  it("maps 5xx to a server-side message", () => {
    expect(getServerErrorMessage(makeAxiosError(500))).toMatch(/on our end/i);
  });

  it("returns a generic message for non-Axios errors", () => {
    expect(getServerErrorMessage(new Error("boom"))).toBe("An unexpected error occurred.");
    expect(getServerErrorMessage("nope")).toBe("An unexpected error occurred.");
  });
});
