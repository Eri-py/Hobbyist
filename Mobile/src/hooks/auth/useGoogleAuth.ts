import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";

// Your Google Client ID from GCP Console
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri(),
  });

  const signIn = async () => {
    try {
      const result = await promptAsync();

      if (result?.type === "success") {
        const { authentication } = result;
        return authentication?.accessToken;
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
    }
  };

  return {
    request,
    response,
    signIn,
  };
}
