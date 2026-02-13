import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

import type { components } from "@hobbyist/api-client";

type AuthResult = components["schemas"]["AuthResult"];

export function useTokenStorage() {
  const setAccessToken = useCallback(async (token: string, expiresAt: string) => {
    try {
      await SecureStore.setItemAsync("access_token", token);
      await SecureStore.setItemAsync("access_token_expires", expiresAt);
    } catch (error) {
      console.error("Failed to store access token in SecureStore", error);
      throw error;
    }
  }, []);

  const setRefreshToken = useCallback(async (token: string, expiresAt: string) => {
    try {
      await SecureStore.setItemAsync("refresh_token", token);
      await SecureStore.setItemAsync("refresh_token_expires", expiresAt);
    } catch (error) {
      console.error("Failed to store refresh token in SecureStore", error);
      throw error;
    }
  }, []);

  const clearTokens = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("access_token_expires");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("refresh_token_expires");
    } catch (cleanupError) {
      console.error("Failed to clean up tokens after auth error", cleanupError);
    }
  }, []);

  const onAuthSuccess = useCallback(
    async (authResult: AuthResult) => {
      try {
        await setAccessToken(authResult.accessToken, authResult.accessTokenExpiresAt);
        await setRefreshToken(authResult.refreshToken, authResult.refreshTokenExpiresAt);
      } catch (error) {
        console.error("Failed to persist authentication tokens", error);
        clearTokens();
      }
    },
    [clearTokens, setAccessToken, setRefreshToken],
  );

  const getAccessToken = useCallback(async () => {
    try {
      return await SecureStore.getItemAsync("access_token");
    } catch {
      return null;
    }
  }, []);

  const getRefreshToken = useCallback(async () => {
    try {
      return await SecureStore.getItemAsync("refresh_token");
    } catch {
      return null;
    }
  }, []);

  return { onAuthSuccess, clearTokens, getAccessToken, getRefreshToken };
}
