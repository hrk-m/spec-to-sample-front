// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handleApiProxy } from "./proxy";

const UPSTREAM_BASE = "http://localhost:8080";

function makeRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {},
): Request {
  return new Request(url, {
    method: options.method ?? "GET",
    headers: options.headers ?? {},
  });
}

function makeMockResponse(options: {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
}): Response {
  return new Response(options.body ?? "OK", {
    status: options.status ?? 200,
    headers: options.headers ?? {},
  });
}

describe("handleApiProxy", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("BE 接続成功 + x-login-user あり → login_user に UUID が記録される", async () => {
    const uuid = "abc-uuid-1234";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "x-login-user": uuid },
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users");
    await handleApiProxy(req, UPSTREAM_BASE);

    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());
    expect(log.login_user).toBe(uuid);
  });

  it("BE 接続成功 + x-login-user なし → login_user が空文字", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: {},
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users");
    await handleApiProxy(req, UPSTREAM_BASE);

    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());
    expect(log.login_user).toBe("");
  });

  it("BE 接続成功 → ブラウザ向けレスポンスに x-login-user ヘッダーが存在しない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "x-login-user": "some-uuid" },
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users");
    const res = await handleApiProxy(req, UPSTREAM_BASE);

    expect(res.headers.get("x-login-user")).toBeNull();
  });

  it("BE 接続失敗（fetch 例外）→ error_message が追加、status が 0、502 を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const req = makeRequest("http://localhost:3000/api/v1/users");
    const res = await handleApiProxy(req, UPSTREAM_BASE);

    expect(res.status).toBe(502);
    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());
    expect(log.error_message).toBe("Error: Connection refused");
    expect(log.status).toBe(0);
  });

  it("authorization ヘッダーマスク → ログの header.authorization が [REDACTED]", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users", {
      headers: { Authorization: "Bearer secret-token" },
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());
    expect(log.header["authorization"]).toBe("[REDACTED]");
  });
});
