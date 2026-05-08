import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch, HttpError } from "@/shared/api";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("正常レスポンス時は JSON をパースして返す", async () => {
    const mockData = { message: "hello" };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200 }));

    const result = await apiFetch<{ message: string }>("/hello");
    expect(result).toEqual(mockData);
  });

  it("エラーレスポンス時は HttpError をスローする", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: "Not Found" }),
    );

    await expect(apiFetch("/not-found")).rejects.toThrow("404 Not Found");
  });

  it("401 レスポンス時は HttpError.status === 401 で判別できる", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 401, statusText: "Unauthorized" }),
    );

    try {
      await apiFetch("/protected");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(401);
    }
  });

  it("正しい URL でリクエストする", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await apiFetch("/test-path");

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/test-path"), expect.any(Object));
  });

  it("RequestInit オプションを fetch に渡す", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    const init: RequestInit = { method: "POST", body: JSON.stringify({ key: "value" }) };
    await apiFetch("/post-endpoint", init);

    // init.headers の組み替えにより厳密一致ではなく部分一致で検証する
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: init.method, body: init.body }),
    );
    const sentInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(sentInit.headers).toBeInstanceOf(Headers);
  });

  it("204 No Content レスポンス時は undefined を返す", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiFetch<void>("/delete-endpoint");
    expect(result).toBeUndefined();
  });

  it("X-Request-ID is auto-attached as UUID v4", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await apiFetch("/api/users");

    const sentInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(sentInit.headers).toBeInstanceOf(Headers);
    const sentHeaders = sentInit.headers as Headers;
    expect(sentHeaders.has("X-Request-ID")).toBe(true);
    expect(sentHeaders.get("X-Request-ID")).toMatch(UUID_V4_REGEX);
  });

  it("explicit X-Request-ID is respected", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await apiFetch("/api/users", { headers: { "X-Request-ID": "fixed-id" } });

    const sentInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const sentHeaders = sentInit.headers as Headers;
    expect(sentHeaders.get("X-Request-ID")).toBe("fixed-id");
  });

  it("consecutive calls produce unique UUIDs", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await apiFetch("/api/users");
    await apiFetch("/api/users");

    const firstInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const secondInit = vi.mocked(fetch).mock.calls[1]?.[1] as RequestInit;
    const firstId = (firstInit.headers as Headers).get("X-Request-ID");
    const secondId = (secondInit.headers as Headers).get("X-Request-ID");
    expect(firstId).not.toBe(secondId);
  });
});
