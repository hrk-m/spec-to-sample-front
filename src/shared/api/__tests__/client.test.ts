import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch, HttpError } from "@/shared/api";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("performance", { now: vi.fn().mockReturnValue(0) });
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

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/test-path"), undefined);
  });

  it("RequestInit オプションを fetch に渡す", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    const init: RequestInit = { method: "POST", body: JSON.stringify({ key: "value" }) };
    await apiFetch("/post-endpoint", init);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), init);
  });

  it("204 No Content レスポンス時は undefined を返す", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiFetch<void>("/delete-endpoint");
    expect(result).toBeUndefined();
  });

  describe("エラー時の構造化ログ出力", () => {
    it("4xx エラー時に console.error で構造化ログを出力する", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(3);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: "Not Found" }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(logged.endpoint).toBe("GET /api/v1/groups");
      expect(logged.status).toBe(404);
      expect(logged.latency_s).toBeCloseTo(0.003, 5);
      expect(logged.time).toBeDefined();
      expect(logged.login_user).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it("5xx エラー時に console.error で構造化ログを出力する", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(5);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups/30/members")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(logged.endpoint).toBe("GET /api/v1/groups/30/members");
      expect(logged.status).toBe(500);

      consoleSpy.mockRestore();
    });

    it("POST メソッド時は endpoint に POST が含まれる", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(2);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 400, statusText: "Bad Request" }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups", { method: "POST", body: "{}" })).rejects.toThrow();

      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(logged.endpoint).toBe("POST /api/v1/groups");

      consoleSpy.mockRestore();
    });

    it("クエリパラメータは endpoint から除去される", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(1);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: "Not Found" }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups?page=1&limit=10")).rejects.toThrow();

      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(logged.endpoint).toBe("GET /api/v1/groups");

      consoleSpy.mockRestore();
    });

    it("X-Login-User ヘッダーがある場合は login_user をログに含める", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(3);
      const headers = new Headers({
        "X-Login-User": "00000000-0000-0000-0000-000000000001",
      });
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error", headers }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups/30/members")).rejects.toThrow();

      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(logged.login_user).toBe("00000000-0000-0000-0000-000000000001");

      consoleSpy.mockRestore();
    });

    it("X-Login-User ヘッダーがない場合は login_user をログに含めない", async () => {
      vi.mocked(performance.now).mockReturnValueOnce(0).mockReturnValueOnce(3);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: "Not Found" }),
      );
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(apiFetch("/api/v1/groups")).rejects.toThrow();

      const logged = JSON.parse(consoleSpy.mock.lastCall?.[0] as string);
      expect(Object.prototype.hasOwnProperty.call(logged, "login_user")).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
