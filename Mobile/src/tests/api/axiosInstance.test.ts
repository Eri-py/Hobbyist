import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import MockAdapter from "axios-mock-adapter";

import { axiosInstance } from "../../api/axiosInstance";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures the mock fns are available when vi.mock runs
// ---------------------------------------------------------------------------

const { mockGetAccessToken, mockGetRefreshToken, mockStoreTokens, mockClearTokens } = vi.hoisted(
  () => ({
    mockGetAccessToken: vi.fn<() => Promise<string | null>>(),
    mockGetRefreshToken: vi.fn<() => Promise<string | null>>(),
    mockStoreTokens: vi.fn<() => Promise<void>>(),
    mockClearTokens: vi.fn<() => Promise<void>>(),
  }),
);

vi.mock("@/api/tokenManager", () => ({
  getAccessToken: mockGetAccessToken,
  getRefreshToken: mockGetRefreshToken,
  storeTokens: mockStoreTokens,
  clearTokens: mockClearTokens,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE = new Date(Date.now() + 3_600_000).toISOString();

const newTokens = {
  accessToken: "new-access-token",
  accessTokenExpiresAt: FUTURE,
  refreshToken: "new-refresh-token",
  refreshTokenExpiresAt: FUTURE,
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("mobile axiosInstance interceptors", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
    mockGetAccessToken.mockResolvedValue("mock-access-token");
    mockGetRefreshToken.mockResolvedValue("mock-refresh-token");
    mockStoreTokens.mockResolvedValue(undefined);
    mockClearTokens.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mock.restore();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Request interceptor — bearer token attachment
  // -------------------------------------------------------------------------

  describe("request interceptor", () => {
    it("attaches Authorization header when an access token exists", async () => {
      mockGetAccessToken.mockResolvedValue("my-token");
      mock.onGet("/me").reply(200, { id: 1 });

      await axiosInstance.get("/me");

      const lastReq = mock.history.get[0];
      expect(lastReq.headers?.Authorization).toBe("Bearer my-token");
    });

    it("sends request without Authorization header when no access token", async () => {
      mockGetAccessToken.mockResolvedValue(null);
      mock.onGet("/me").reply(200, {});

      await axiosInstance.get("/me");

      const lastReq = mock.history.get[0];
      expect(lastReq.headers?.Authorization).toBeUndefined();
    });

    it("skips token attachment for the refresh-token endpoint", async () => {
      mock.onPost("/auth-session/refresh-token").reply(200, newTokens);

      await axiosInstance.post("/auth-session/refresh-token", {
        refreshToken: "rt",
      });

      // getAccessToken must NOT be called for the refresh endpoint
      expect(mockGetAccessToken).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Response interceptor — 401 handling
  // -------------------------------------------------------------------------

  describe("response interceptor", () => {
    it("passes non-401 errors through without triggering a refresh", async () => {
      mock.onGet("/data").reply(500, { error: "Server error" });

      await expect(axiosInstance.get("/data")).rejects.toMatchObject({
        response: { status: 500 },
      });

      expect(mockGetRefreshToken).not.toHaveBeenCalled();
    });

    it("rejects immediately on 401 from the refresh-token endpoint itself", async () => {
      mock.onPost("/auth-session/refresh-token").reply(401, {});

      // The refresh endpoint URL contains 'auth-session/refresh-token' so the
      // interceptor must not attempt another refresh.
      await expect(
        axiosInstance.post("/auth-session/refresh-token", { refreshToken: "bad" }),
      ).rejects.toMatchObject({ response: { status: 401 } });

      // clearTokens is called when the refresh endpoint itself returns 401
      expect(mockClearTokens).toHaveBeenCalledTimes(1);
      expect(mockStoreTokens).not.toHaveBeenCalled();
    });

    it("retries the original request with new tokens after a successful refresh", async () => {
      // First call to /protected → 401; retry → 200
      mock.onGet("/protected").replyOnce(401).onGet("/protected").reply(200, { ok: true });
      mock.onPost("/auth-session/refresh-token").reply(200, newTokens);

      const response = await axiosInstance.get("/protected");

      expect(response.data).toEqual({ ok: true });
      expect(mockStoreTokens).toHaveBeenCalledWith(newTokens);
    });

    it("rejects when no refresh token is available", async () => {
      mockGetRefreshToken.mockResolvedValue(null);
      mock.onGet("/protected").reply(401, {});

      await expect(axiosInstance.get("/protected")).rejects.toThrow("Missing refresh token");

      expect(mockStoreTokens).not.toHaveBeenCalled();
      expect(mockClearTokens).toHaveBeenCalledTimes(1);
    });

    it("clears tokens when the refresh call returns 401", async () => {
      mock.onGet("/protected").reply(401, {});
      mock.onPost("/auth-session/refresh-token").reply(401, {});

      await expect(axiosInstance.get("/protected")).rejects.toBeDefined();

      expect(mockClearTokens).toHaveBeenCalled();
    });

    it("does NOT clear tokens on a non-401 refresh failure (network/5xx)", async () => {
      mock.onGet("/protected").reply(401, {});
      mock.onPost("/auth-session/refresh-token").reply(503, {});

      await expect(axiosInstance.get("/protected")).rejects.toBeDefined();

      expect(mockClearTokens).not.toHaveBeenCalled();
    });

    it("rejects queued requests when storeTokens fails after a successful refresh", async () => {
      const storeError = new Error("Failed to persist authentication tokens");
      mockStoreTokens.mockRejectedValue(storeError);

      mock.onGet("/protected").reply(401, {});
      mock.onPost("/auth-session/refresh-token").reply(200, newTokens);

      await expect(axiosInstance.get("/protected")).rejects.toThrow(
        "Failed to persist authentication tokens",
      );
    });

    it("fires only one refresh when multiple requests receive 401 concurrently", async () => {
      // Both initial requests return 401; both retries return 200
      mock.onGet("/a").replyOnce(401).onGet("/a").reply(200, { resource: "a" });
      mock.onGet("/b").replyOnce(401).onGet("/b").reply(200, { resource: "b" });
      mock.onPost("/auth-session/refresh-token").reply(200, newTokens);

      const [resA, resB] = await Promise.all([axiosInstance.get("/a"), axiosInstance.get("/b")]);

      expect(resA.data).toEqual({ resource: "a" });
      expect(resB.data).toEqual({ resource: "b" });
      // Only one refresh should have been attempted
      expect(mock.history.post.filter((r) => r.url?.includes("refresh-token"))).toHaveLength(1);
    });
  });
});
