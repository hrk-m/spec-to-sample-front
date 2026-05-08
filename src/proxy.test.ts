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

  it("ヘッダー許可リスト → 許可リスト内ヘッダーのみが header に含まれる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users", {
      headers: {
        accept: "*/*",
        referer: "http://localhost:3000/",
        "sec-ch-ua": '"Chromium";v="146"',
        "sec-ch-ua-platform": '"macOS"',
        "user-agent": "Mozilla/5.0",
        authorization: "Bearer secret-token",
        cookie: "session=abc",
        "sec-fetch-site": "same-origin",
        "sec-ch-ua-mobile": "?0",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "ja,en;q=0.9",
        connection: "keep-alive",
      },
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());

    // 許可リスト内ヘッダーが含まれる（referer / sec-ch-ua / sec-ch-ua-mobile / sec-ch-ua-platform のみ）
    expect(log.header["referer"]).toBe("http://localhost:3000/");
    expect(log.header["sec-ch-ua"]).toBe('"Chromium";v="146"');
    expect(log.header["sec-ch-ua-mobile"]).toBe("?0");
    expect(log.header["sec-ch-ua-platform"]).toBe('"macOS"');

    // 許可リスト外ヘッダーが含まれない（authorization は [REDACTED] ではなく完全に存在しない）
    expect(log.header).not.toHaveProperty("accept");
    expect(log.header).not.toHaveProperty("user-agent");
    expect(log.header).not.toHaveProperty("authorization");
    expect(log.header).not.toHaveProperty("cookie");
    expect(log.header).not.toHaveProperty("sec-fetch-site");
    expect(log.header).not.toHaveProperty("accept-encoding");
    expect(log.header).not.toHaveProperty("accept-language");
    expect(log.header).not.toHaveProperty("connection");
  });

  it("ヘッダー許可リスト（大文字混じり）→ キーが大文字でも許可判定が正しく行われる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
        }),
      ),
    );

    const req = makeRequest("http://localhost:3000/api/v1/users", {
      headers: {
        "Sec-Ch-Ua-Platform": '"macOS"',
        "User-Agent": "Mozilla/5.0",
        Authorization: "Bearer secret-token",
      },
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    expect(writeSpy).toHaveBeenCalledOnce();
    const logLine = writeSpy.mock.calls[0][0] as string;
    const log = JSON.parse(logLine.trim());

    // Sec-Ch-Ua-Platform は許可リスト内なので含まれる（Bun の Headers API は lowercase で返す）
    expect(log.header["sec-ch-ua-platform"]).toBe('"macOS"');
    // User-Agent は許可リスト外なので含まれない
    expect(log.header).not.toHaveProperty("user-agent");
    // Authorization は許可リスト外なので含まれない
    expect(log.header).not.toHaveProperty("authorization");
  });

  // #6: request_body 記録（Content-Type: application/json + body あり）
  it("#6 request_body 記録 → Content-Type: application/json のリクエストで request_body が記録される", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: "abc" }),
        }),
      ),
    );

    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", name: "Alice" }),
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    const log = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(log).toHaveProperty("request_body");
    expect(log.request_body.email).toBe("user@example.com");
    expect(log.request_body.name).toBe("Alice");
  });

  // #7: request_body マスク（機微キーのマスク・ネスト再帰・大文字小文字無視）
  it("#7 request_body マスク → 機微キーの値が [REDACTED] に置換される（ネスト再帰・大文字小文字無視）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      ),
    );

    const body = {
      email: "user@example.com",
      password: "p@ssw0rd",
      TOKEN: "my-token",
      nested: {
        access_token: "at-value",
        refresh_token: "rt-value",
        api_key: "key-value",
        secret: "sec-value",
        Authorization: "auth-value",
        safe: "keep-me",
      },
      items: [{ token: "item-token", name: "item1" }],
    };

    const req = new Request("http://localhost:3000/api/v1/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    const log = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(log.request_body.email).toBe("user@example.com");
    expect(log.request_body.password).toBe("[REDACTED]");
    // 大文字キー TOKEN → キー名は小文字に変換されず、値だけマスクされる（大文字小文字無視でマスク判定）
    expect(log.request_body.TOKEN).toBe("[REDACTED]");
    // ネストオブジェクト
    expect(log.request_body.nested.access_token).toBe("[REDACTED]");
    expect(log.request_body.nested.refresh_token).toBe("[REDACTED]");
    expect(log.request_body.nested.api_key).toBe("[REDACTED]");
    expect(log.request_body.nested.secret).toBe("[REDACTED]");
    expect(log.request_body.nested.Authorization).toBe("[REDACTED]");
    expect(log.request_body.nested.safe).toBe("keep-me");
    // 配列内オブジェクト
    expect(log.request_body.items[0].token).toBe("[REDACTED]");
    expect(log.request_body.items[0].name).toBe("item1");
  });

  // #8: request_body 非 JSON / 空（フィールド自体が出力されない）
  it("#8 request_body 非 JSON / 空 → Content-Type が text/plain や body なし（GET）時は request_body フィールドが出力されない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      ),
    );

    // GET リクエスト（body なし）
    const getReq = makeRequest("http://localhost:3000/api/v1/users");
    await handleApiProxy(getReq, UPSTREAM_BASE);
    const getLog = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(getLog).not.toHaveProperty("request_body");

    writeSpy.mockClear();

    // POST リクエスト + Content-Type: text/plain
    const textReq = new Request("http://localhost:3000/api/v1/data", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "some text body",
    });
    await handleApiProxy(textReq, UPSTREAM_BASE);
    const textLog = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(textLog).not.toHaveProperty("request_body");

    writeSpy.mockClear();

    // POST リクエスト + Content-Type: application/json + 空ボディ
    const emptyReq = new Request("http://localhost:3000/api/v1/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "",
    });
    await handleApiProxy(emptyReq, UPSTREAM_BASE);
    const emptyLog = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(emptyLog).not.toHaveProperty("request_body");
  });

  // #9: request_body 4KB 超（truncated 扱い）
  it("#9 request_body 4KB 超 → { _truncated: true, size_bytes: N } が出力される", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      ),
    );

    // 5KB の JSON ボディを生成（"a" * 5000）
    const largeValue = "a".repeat(5000);
    const largeBody = JSON.stringify({ data: largeValue });
    const sizeBytes = new TextEncoder().encode(largeBody).length;

    const req = new Request("http://localhost:3000/api/v1/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: largeBody,
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    const log = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(log.request_body).toEqual({ _truncated: true, size_bytes: sizeBytes });
  });

  // #10: request_body パース失敗（{ _parse_error: true }）
  it("#10 request_body パース失敗 → { _parse_error: true } が出力される", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeMockResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      ),
    );

    const req = new Request("http://localhost:3000/api/v1/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid json",
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    const log = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(log.request_body).toEqual({ _parse_error: true });
  });

  // #11: リクエストボディの BE 転送整合性
  it("#11 リクエストボディの BE 転送整合性 → req.clone() を使い、BE への fetch に渡す body が完全に保持される", async () => {
    const originalBody = JSON.stringify({ email: "user@example.com", password: "p@ssw0rd" });

    const mockFetch = vi.fn().mockResolvedValue(
      makeMockResponse({
        status: 200,
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: originalBody,
    });
    await handleApiProxy(req, UPSTREAM_BASE);

    // BE への fetch 呼び出しを確認
    expect(mockFetch).toHaveBeenCalledOnce();
    const fetchOptions = (mockFetch.mock.calls[0] as Parameters<typeof fetch>)[1] as RequestInit;

    // body が存在し、かつ送信内容が元のボディと一致する
    const sentBody = fetchOptions.body;
    let sentBodyText: string;
    if (typeof sentBody === "string") {
      sentBodyText = sentBody;
    } else if (sentBody instanceof ReadableStream) {
      sentBodyText = await new Response(sentBody).text();
    } else {
      sentBodyText = "";
    }

    expect(sentBodyText).toBe(originalBody);
  });
});
