import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

import type { components } from "@hobbyist/api-client";

type AuthResult = components["schemas"]["AuthResult"];

export function useTokenStorage() {
  const setAccessToken = useCallback(async (token: string, expiresAt: string) => {
    await SecureStore.setItemAsync("access_token", token);
    await SecureStore.setItemAsync("access_token_expires", expiresAt);
  }, []);

  const setRefreshToken = useCallback(async (token: string, expiresAt: string) => {
    await SecureStore.setItemAsync("refresh_token", token);
    await SecureStore.setItemAsync("refresh_token_expires", expiresAt);
  }, []);

  const clearTokens = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("access_token_expires");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("refresh_token_expires");
  }, []);

  const onAuthSuccess = useCallback(
    async (authResult: AuthResult) => {
      try {
        await setAccessToken(authResult.accessToken, authResult.accessTokenExpiresAt);
        await setRefreshToken(authResult.refreshToken, authResult.refreshTokenExpiresAt);
      } catch (error) {
        clearTokens();
        throw error;
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

  return { onAuthSuccess, getAccessToken, getRefreshToken };
}
