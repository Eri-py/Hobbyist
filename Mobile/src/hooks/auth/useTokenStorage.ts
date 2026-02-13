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

  const onAuthSuccess = useCallback(
    async (authResult: AuthResult) => {
      await setAccessToken(authResult.accessToken, authResult.accessTokenExpiresAt);
      await setRefreshToken(authResult.refreshToken, authResult.refreshTokenExpiresAt);
    },
    [setAccessToken, setRefreshToken],
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
