// triage に必要なヘッダーのみをログに記録する（許可リスト方式）
// 許可リスト外（authorization・cookie・sec-fetch-* 等）はログから完全除外する
const ALLOWED_LOG_HEADERS = new Set([
  "referer",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
]);

// ボディ記録の上限サイズ（4096 バイト = 4KB）
const BODY_SIZE_LIMIT = 4096;

// 機微キーマスク対象セット（lowercase で保持）
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "authorization",
]);

/**
 * JSON オブジェクトを再帰的に走査して機微キーの値を "[REDACTED]" に置換する。
 * - plain object: キーを走査して機微キーなら値を置換、そうでなければ再帰
 * - array: 各要素に再帰
 * - プリミティブ: そのまま返す
 */
function maskSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveValues(item));
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        result[k] = "[REDACTED]";
      } else {
        result[k] = maskSensitiveValues(v);
      }
    }
    return result;
  }
  return value;
}

/**
 * テキストからボディフィールドの値を生成する。
 * - 空文字列 → undefined（フィールド自体を出さない）
 * - 4KB 超 → { _truncated: true, size_bytes: N }
 * - JSON パース失敗 → { _parse_error: true }
 * - 正常 → マスク済みオブジェクト
 */
function buildBodyField(text: string): Record<string, unknown> | undefined {
  if (text === "") {
    return undefined;
  }

  const sizeBytes = new TextEncoder().encode(text).length;
  if (sizeBytes > BODY_SIZE_LIMIT) {
    return { _truncated: true, size_bytes: sizeBytes };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { _parse_error: true };
  }

  return maskSensitiveValues(parsed) as Record<string, unknown>;
}

export async function handleApiProxy(req: Request, upstreamBase: string): Promise<Response> {
  const start = performance.now();

  const headers = new Headers(req.headers);
  headers.delete("host");

  const reqUrl = new URL(req.url);
  const upstreamUrl = `${upstreamBase}${reqUrl.pathname}${reqUrl.search}`;

  const endpoint = `${req.method} ${reqUrl.pathname}`;

  const logHeader: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (ALLOWED_LOG_HEADERS.has(key.toLowerCase())) {
      logHeader[key] = value;
    }
  });

  // リクエストボディの取得（Content-Type に application/json を含む場合のみ）
  const reqContentType = req.headers.get("content-type") ?? "";
  let reqBodyText = "";
  let reqBodyForUpstream: string | ReadableStream<Uint8Array> | null = req.body;

  if (reqContentType.includes("application/json")) {
    // clone() でボディを読み取り、元のボディは文字列として再送する
    reqBodyText = await req.clone().text();
    // 読み取った文字列を BE 転送用に使う（ReadableStream が消費済みになるため）
    reqBodyForUpstream = reqBodyText;
  }

  try {
    const beRes = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: reqBodyForUpstream,
    });

    const loginUser = beRes.headers.get("x-login-user") ?? "";
    const latency_s = (performance.now() - start) / 1000;

    const responseHeaders = new Headers(beRes.headers);
    responseHeaders.delete("x-login-user");

    // ログ用ボディフィールドの生成
    const reqBodyField = reqContentType.includes("application/json")
      ? buildBodyField(reqBodyText)
      : undefined;

    const log: Record<string, unknown> = {
      time: new Date().toISOString(),
      endpoint,
      login_user: loginUser,
      latency_s,
      status: beRes.status,
      header: logHeader,
      ...(reqBodyField !== undefined && { request_body: reqBodyField }),
    };

    process.stdout.write(JSON.stringify(log) + "\n");

    return new Response(beRes.body, {
      status: beRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const latency_s = (performance.now() - start) / 1000;

    const log: Record<string, unknown> = {
      time: new Date().toISOString(),
      endpoint,
      login_user: "",
      latency_s,
      status: 0,
      header: logHeader,
      error_message: String(err),
    };

    process.stdout.write(JSON.stringify(log) + "\n");

    return new Response("Bad Gateway", { status: 502 });
  }
}
