import * as SecureStore from "expo-secure-store";
import type { components } from "@hobbyist/types";

type AuthResult = components["schemas"]["AuthResult"];

// Centralized key constants
export const ACCESS_TOKEN_KEY = "access_token";
export const ACCESS_TOKEN_EXPIRES_KEY = "access_token_expires";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const REFRESH_TOKEN_EXPIRES_KEY = "refresh_token_expires";

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const expiresAt = await SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_KEY);

    if (!accessToken) {
      return null;
    }

    // Check if token is expired
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_KEY);
      return null;
    }

    return accessToken;
  } catch {
    // SecureStore unavailable — treat as unauthenticated; the interceptor will
    // handle the resulting 401 and attempt a refresh.
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const expiresAt = await SecureStore.getItemAsync(REFRESH_TOKEN_EXPIRES_KEY);

    if (!token) return null;

    // Check if token is expired
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_KEY);
      return null;
    }

    return token;
  } catch {
    return null;
  }
};

export const storeTokens = async (authResult: AuthResult): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authResult.accessToken);
    await SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_KEY, authResult.accessTokenExpiresAt);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authResult.refreshToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_EXPIRES_KEY, authResult.refreshTokenExpiresAt);
  } catch (error) {
    // Re-throw so the axios interceptor can reject queued requests rather than
    // leaving them with a silently missing token.
    throw new Error("Failed to persist authentication tokens", { cause: error });
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_KEY);
  } catch {
    // Best-effort cleanup; stale tokens will be rejected by the server on next
    // use and cleared when the subsequent 401 triggers a failed refresh.
  }
};
