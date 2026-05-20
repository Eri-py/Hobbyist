import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { axiosInstance } from "../../api/axiosInstance";

// The website interceptor uses HTTP-only cookies, so there is no bearer token
// management to mock — just the network responses.

describe("website axiosInstance interceptors", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mock.restore();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Pass-through behaviour
  // -------------------------------------------------------------------------

  it("resolves successfully on 2xx responses", async () => {
    mock.onGet("/posts").reply(200, [{ id: 1 }]);

    const res = await axiosInstance.get("/posts");

    expect(res.status).toBe(200);
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it("passes non-401 errors through without triggering a token refresh", async () => {
    mock.onGet("/posts").reply(500, { error: "Internal Server Error" });

    await expect(axiosInstance.get("/posts")).rejects.toMatchObject({
      response: { status: 500 },
    });

    // Refresh endpoint must never have been called
    expect(mock.history.post.some((r) => r.url?.includes("refresh-token"))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 401 handling — guard rails
  // -------------------------------------------------------------------------

  it("rejects immediately on 401 from the refresh-token endpoint itself", async () => {
    mock.onPost("auth-session/refresh-token").reply(401, {});

    await expect(
      axiosInstance.post("auth-session/refresh-token"),
    ).rejects.toMatchObject({ response: { status: 401 } });

    // Must not call refresh again (no second POST to the same endpoint)
    expect(mock.history.post.filter((r) => r.url?.includes("refresh-token"))).toHaveLength(1);
  });

  it("rejects immediately on a second 401 for a request already marked _retry", async () => {
    // Simulate a request that has already been retried once but 401s again
    mock
      .onGet("/protected")
      .replyOnce(401) // first request → triggers refresh
      .onGet("/protected")
      .reply(401); // retry → must NOT refresh again
    mock.onPost("auth-session/refresh-token").reply(200, {});

    await expect(axiosInstance.get("/protected")).rejects.toMatchObject({
      response: { status: 401 },
    });

    // Exactly one refresh attempt
    expect(mock.history.post.filter((r) => r.url?.includes("refresh-token"))).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // 401 happy path — refresh and retry
  // -------------------------------------------------------------------------

  it("refreshes the token and retries the original request on 401", async () => {
    mock
      .onGet("/protected")
      .replyOnce(401)
      .onGet("/protected")
      .reply(200, { data: "secret" });
    mock.onPost("auth-session/refresh-token").reply(200, {});

    const res = await axiosInstance.get("/protected");

    expect(res.data).toEqual({ data: "secret" });
    expect(mock.history.post).toHaveLength(1); // exactly one refresh
    expect(mock.history.get.filter((r) => r.url === "/protected")).toHaveLength(2); // original + retry
  });

  // -------------------------------------------------------------------------
  // 401 failure path — refresh fails
  // -------------------------------------------------------------------------

  it("rejects with the refresh error when the refresh call fails", async () => {
    mock.onGet("/protected").reply(401, {});
    mock.onPost("auth-session/refresh-token").reply(403, { error: "Forbidden" });

    await expect(axiosInstance.get("/protected")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent 401s — one refresh, all requests re-queued
  // -------------------------------------------------------------------------

  it("fires only one refresh when multiple requests receive 401 concurrently", async () => {
    mock
      .onGet("/a")
      .replyOnce(401)
      .onGet("/a")
      .reply(200, { resource: "a" });
    mock
      .onGet("/b")
      .replyOnce(401)
      .onGet("/b")
      .reply(200, { resource: "b" });
    mock.onPost("auth-session/refresh-token").reply(200, {});

    const [resA, resB] = await Promise.all([
      axiosInstance.get("/a"),
      axiosInstance.get("/b"),
    ]);

    expect(resA.data).toEqual({ resource: "a" });
    expect(resB.data).toEqual({ resource: "b" });
    // Exactly one refresh regardless of how many 401s fired
    expect(mock.history.post.filter((r) => r.url?.includes("refresh-token"))).toHaveLength(1);
  });

  it("rejects all queued requests when the refresh fails during concurrent 401s", async () => {
    mock.onGet("/a").reply(401, {});
    mock.onGet("/b").reply(401, {});
    mock.onPost("auth-session/refresh-token").reply(401, {});

    const [resultA, resultB] = await Promise.allSettled([
      axiosInstance.get("/a"),
      axiosInstance.get("/b"),
    ]);

    expect(resultA.status).toBe("rejected");
    expect(resultB.status).toBe("rejected");
  });
});
