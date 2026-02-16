import * as SecureStore from "expo-secure-store";
import type { components } from "@hobbyist/types";

type AuthResult = components["schemas"]["AuthResult"];

// Centralized key constants
export const ACCESS_TOKEN_KEY = "access_token";
export const ACCESS_TOKEN_EXPIRES_KEY = "access_token_expires";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const REFRESH_TOKEN_EXPIRES_KEY = "refresh_token_expires";

export const getAccessToken = async (): Promise<string | null> => {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const expiresAt = await SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_KEY);

  if (!accessToken) {
    return null;
  }

  // Check if token is expired
  if (expiresAt && new Date(expiresAt) <= new Date()) {
    // Delete expired token
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_KEY);
    return null;
  }

  return accessToken;
};

export const getRefreshToken = async (): Promise<string | null> => {
  const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const expiresAt = await SecureStore.getItemAsync(REFRESH_TOKEN_EXPIRES_KEY);

  if (!token) return null;

  // Check if token is expired
  if (expiresAt && new Date(expiresAt) <= new Date()) {
    // Delete expired token
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_KEY);
    return null;
  }

  return token;
};

export const storeTokens = async (authResult: AuthResult): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authResult.accessToken);
  await SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_KEY, authResult.accessTokenExpiresAt);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authResult.refreshToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_EXPIRES_KEY, authResult.refreshTokenExpiresAt);
};

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_KEY);
};
