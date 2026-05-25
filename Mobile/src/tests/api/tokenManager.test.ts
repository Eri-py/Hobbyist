import { vi, beforeEach, describe, it, expect } from "vitest";
import * as SecureStore from "expo-secure-store";
import * as TokenManager from "../../api/tokenManager";
import {
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_EXPIRES_KEY,
  REFRESH_TOKEN_KEY,
  REFRESH_TOKEN_EXPIRES_KEY,
} from "../../api/tokenManager";

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const futureDate = new Date(Date.now() + 3_600_000).toISOString();
const pastDate = new Date(Date.now() - 1_000).toISOString();

const mockGetItem = vi.mocked(SecureStore.getItemAsync);
const mockSetItem = vi.mocked(SecureStore.setItemAsync);
const mockDeleteItem = vi.mocked(SecureStore.deleteItemAsync);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getAccessToken
// ---------------------------------------------------------------------------

describe("getAccessToken", () => {
  it("returns null when no token is stored", async () => {
    mockGetItem.mockResolvedValue(null);

    const token = await TokenManager.getAccessToken();

    expect(token).toBeNull();
  });

  it("returns the token when it exists and has not expired", async () => {
    mockGetItem.mockImplementation(async (key) => {
      if (key === ACCESS_TOKEN_KEY) return "valid-access-token";
      if (key === ACCESS_TOKEN_EXPIRES_KEY) return futureDate;
      return null;
    });

    const token = await TokenManager.getAccessToken();

    expect(token).toBe("valid-access-token");
  });

  it("returns null and deletes the token when it has expired", async () => {
    mockGetItem.mockImplementation(async (key) => {
      if (key === ACCESS_TOKEN_KEY) return "expired-access-token";
      if (key === ACCESS_TOKEN_EXPIRES_KEY) return pastDate;
      return null;
    });
    mockDeleteItem.mockResolvedValue(undefined);

    const token = await TokenManager.getAccessToken();

    expect(token).toBeNull();
    expect(mockDeleteItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(ACCESS_TOKEN_EXPIRES_KEY);
  });

  it("returns null when SecureStore throws", async () => {
    mockGetItem.mockRejectedValue(new Error("SecureStore unavailable"));

    const token = await TokenManager.getAccessToken();

    expect(token).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getRefreshToken
// ---------------------------------------------------------------------------

describe("getRefreshToken", () => {
  it("returns null when no token is stored", async () => {
    mockGetItem.mockResolvedValue(null);

    const token = await TokenManager.getRefreshToken();

    expect(token).toBeNull();
  });

  it("returns the token when it exists and has not expired", async () => {
    mockGetItem.mockImplementation(async (key) => {
      if (key === REFRESH_TOKEN_KEY) return "valid-refresh-token";
      if (key === REFRESH_TOKEN_EXPIRES_KEY) return futureDate;
      return null;
    });

    const token = await TokenManager.getRefreshToken();

    expect(token).toBe("valid-refresh-token");
  });

  it("returns null and deletes the token when it has expired", async () => {
    mockGetItem.mockImplementation(async (key) => {
      if (key === REFRESH_TOKEN_KEY) return "expired-refresh-token";
      if (key === REFRESH_TOKEN_EXPIRES_KEY) return pastDate;
      return null;
    });
    mockDeleteItem.mockResolvedValue(undefined);

    const token = await TokenManager.getRefreshToken();

    expect(token).toBeNull();
    expect(mockDeleteItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(REFRESH_TOKEN_EXPIRES_KEY);
  });

  it("returns null when SecureStore throws", async () => {
    mockGetItem.mockRejectedValue(new Error("SecureStore unavailable"));

    const token = await TokenManager.getRefreshToken();

    expect(token).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// storeTokens
// ---------------------------------------------------------------------------

describe("storeTokens", () => {
  const authResult = {
    accessToken: "new-access",
    accessTokenExpiresAt: futureDate,
    refreshToken: "new-refresh",
    refreshTokenExpiresAt: futureDate,
  } as any;

  it("writes all four values to SecureStore", async () => {
    mockSetItem.mockResolvedValue(undefined);

    await TokenManager.storeTokens(authResult);

    expect(mockSetItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY, authResult.accessToken);
    expect(mockSetItem).toHaveBeenCalledWith(ACCESS_TOKEN_EXPIRES_KEY, authResult.accessTokenExpiresAt);
    expect(mockSetItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, authResult.refreshToken);
    expect(mockSetItem).toHaveBeenCalledWith(REFRESH_TOKEN_EXPIRES_KEY, authResult.refreshTokenExpiresAt);
    expect(mockSetItem).toHaveBeenCalledTimes(4);
  });

  it("throws when SecureStore fails so the interceptor can reject queued requests", async () => {
    mockSetItem.mockRejectedValue(new Error("Keychain locked"));

    await expect(TokenManager.storeTokens(authResult)).rejects.toThrow(
      "Failed to persist authentication tokens",
    );
  });
});

// ---------------------------------------------------------------------------
// clearTokens
// ---------------------------------------------------------------------------

describe("clearTokens", () => {
  it("deletes all four keys from SecureStore", async () => {
    mockDeleteItem.mockResolvedValue(undefined);

    await TokenManager.clearTokens();

    expect(mockDeleteItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(ACCESS_TOKEN_EXPIRES_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(REFRESH_TOKEN_EXPIRES_KEY);
    expect(mockDeleteItem).toHaveBeenCalledTimes(4);
  });

  it("swallows SecureStore errors — clearTokens is best-effort", async () => {
    mockDeleteItem.mockRejectedValue(new Error("Keychain locked"));

    await expect(TokenManager.clearTokens()).resolves.toBeUndefined();
  });
});
