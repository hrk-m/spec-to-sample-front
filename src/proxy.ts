export async function handleApiProxy(req: Request, upstreamBase: string): Promise<Response> {
  const start = performance.now();

  const headers = new Headers(req.headers);
  headers.delete("host");

  const reqUrl = new URL(req.url);
  const upstreamUrl = `${upstreamBase}${reqUrl.pathname}${reqUrl.search}`;

  const endpoint = `${req.method} ${reqUrl.pathname}`;

  const logHeader: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    logHeader[key] = key.toLowerCase() === "authorization" ? "[REDACTED]" : value;
  });

  try {
    const beRes = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.body,
    });

    const loginUser = beRes.headers.get("x-login-user") ?? "";
    const latency_s = (performance.now() - start) / 1000;

    const responseHeaders = new Headers(beRes.headers);
    responseHeaders.delete("x-login-user");

    const log = {
      time: new Date().toISOString(),
      endpoint,
      login_user: loginUser,
      latency_s,
      status: beRes.status,
      header: logHeader,
    };

    process.stdout.write(JSON.stringify(log) + "\n");

    return new Response(beRes.body, {
      status: beRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const latency_s = (performance.now() - start) / 1000;

    const log = {
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
